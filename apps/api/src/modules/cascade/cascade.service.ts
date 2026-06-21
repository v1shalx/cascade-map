import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CascadeRepository } from './cascade.repository';
import { SchemaDiscoveryRepository } from '../schema-discovery/schema-discovery.repository';
import type { CascadeResponse, CascadeWave } from '@cascade-map/shared';
import type { AppConfig } from '../../config/env.config';

/**
 * BFS traversal engine.
 *
 * Starting from a root (table, id), expands outward one FK hop per wave.
 * Each wave = all rows in child tables that reference rows found in the previous wave.
 * Caps at MAX_TRAVERSAL_DEPTH and MAX_ROWS_PER_TABLE from env config.
 */
@Injectable()
export class CascadeService {
  private readonly logger = new Logger(CascadeService.name);
  private readonly maxDepth: number;
  private readonly maxRowsPerTable: number;

  constructor(
    private readonly cascadeRepo: CascadeRepository,
    private readonly schemaRepo: SchemaDiscoveryRepository,
    private readonly config: ConfigService<AppConfig, true>,
  ) {
    this.maxDepth = this.config.get('MAX_TRAVERSAL_DEPTH', { infer: true });
    this.maxRowsPerTable = this.config.get('MAX_ROWS_PER_TABLE', { infer: true });
  }

  async simulate(table: string, id: number): Promise<CascadeResponse> {
    // 1. Validate table name against information_schema — prevents SQL injection via identifier
    const tableValid = await this.schemaRepo.tableExists(table);
    if (!tableValid) {
      throw new BadRequestException(`Table '${table}' does not exist in this schema`);
    }

    // 2. Confirm root row exists — gives a clean 404 rather than an empty traversal
    const rootExists = await this.cascadeRepo.rootRowExists(table, id);
    if (!rootExists) {
      throw new NotFoundException(`Row with id=${id} not found in table '${table}'`);
    }

    this.logger.log(`Starting cascade simulation: ${table}#${id}`);

    const waves: CascadeWave[] = [];
    // BFS frontier: map of tableName → set of IDs discovered at the current depth
    let frontier = new Map<string, number[]>([[table, [id]]]);
    // Track all visited (table, id) pairs to avoid cycles
    const visited = new Map<string, Set<number>>();
    visited.set(table, new Set([id]));

    let depth = 0;

    while (frontier.size > 0 && depth < this.maxDepth) {
      depth++;

      // Find all FK relationships pointing at any table in the current frontier
      const parentTables = [...frontier.keys()];
      const fkEdges = await this.cascadeRepo.getFkRelationshipsPointingTo(parentTables);

      if (fkEdges.length === 0) break;

      const nextFrontier = new Map<string, number[]>();

      for (const edge of fkEdges) {
        const parentIds = frontier.get(edge.to);
        if (!parentIds || parentIds.length === 0) continue;

        // Count before fetching to detect truncation
        const total = await this.cascadeRepo.countChildRows(
          edge.from,
          edge.fromCol,
          parentIds,
        );
        if (total === 0) continue;

        const truncated = total > this.maxRowsPerTable;
        const ids = await this.cascadeRepo.getChildIds(
          edge.from,
          edge.fromCol,
          parentIds,
          this.maxRowsPerTable,
        );

        // Filter out already-visited rows (handles diamond FK patterns)
        if (!visited.has(edge.from)) {
          visited.set(edge.from, new Set());
        }
        const visitedForTable = visited.get(edge.from)!;
        const newIds = ids.filter((rowId: number) => !visitedForTable.has(rowId));
        newIds.forEach((rowId: number) => visitedForTable.add(rowId));

        if (newIds.length === 0) continue;

        waves.push({ depth, table: edge.from, ids: newIds, truncated });

        // Merge into next frontier (same child table can be reached via multiple FKs)
        const existing = nextFrontier.get(edge.from) ?? [];
        nextFrontier.set(edge.from, [...existing, ...newIds]);
      }

      frontier = nextFrontier;
    }

    const totalAffected = waves.reduce((sum, w) => sum + w.ids.length, 0);
    this.logger.log(
      `Cascade simulation complete: ${waves.length} waves, ${totalAffected} rows affected`,
    );

    return {
      root: { table, id },
      waves,
      totalAffected,
    };
  }
}
