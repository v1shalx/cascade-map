import { Injectable, Logger } from '@nestjs/common';
import { SchemaDiscoveryRepository } from '../schema-discovery/schema-discovery.repository';
import type { IsolationCheckResponse, FkRelationship } from '@cascade-map/shared';

/**
 * Tenant isolation leak detector.
 *
 * Algorithm:
 *   For every table, walk all paths back through the FK graph toward `tenants`.
 *   A table is SAFE if at least one path back passes through a tenant-scoping
 *   column (any column named like `tenant_id`, `tenant_uuid`, etc.).
 *   A table is FLAGGED if it is reachable from data without any tenant-scoping
 *   column in the chain — meaning a query could cross tenant boundaries.
 *
 * Tables with a direct `tenant_id` column are always safe.
 * The `tenants` table itself is the anchor and is excluded from results.
 */
@Injectable()
export class IsolationCheckService {
  private readonly logger = new Logger(IsolationCheckService.name);

  // Column name patterns that count as tenant-scoping
  private readonly TENANT_COLUMN_PATTERNS = [/^tenant_id$/i, /^tenant_uuid$/i, /^org_id$/i];

  constructor(private readonly schemaRepo: SchemaDiscoveryRepository) {}

  async check(): Promise<IsolationCheckResponse> {
    this.logger.log('Running tenant isolation check');

    const [rawColumns, tableNames, relationships] = await Promise.all([
      this.schemaRepo.getAllColumns(),
      this.schemaRepo.getTableNames(),
      this.schemaRepo.getFkRelationships(),
    ]);
    const tables = this.schemaRepo.buildTableSchemas(tableNames, rawColumns);

    // Build a set of tables that have a direct tenant-scoping column
    const directlyScopedTables = new Set<string>();
    for (const table of tables) {
      const hasTenantCol = table.columns.some((col: { name: string }) =>
        this.TENANT_COLUMN_PATTERNS.some((pattern) => pattern.test(col.name)),
      );
      if (hasTenantCol) {
        directlyScopedTables.add(table.name);
      }
    }

    // Build adjacency: parentTable → list of {childTable, fkColumn}
    // (which tables reference which)
    const childrenOf = new Map<string, Array<{ table: string; col: string }>>();
    for (const rel of relationships) {
      const children = childrenOf.get(rel.to) ?? [];
      children.push({ table: rel.from, col: rel.fromCol });
      childrenOf.set(rel.to, children);
    }

    const nonTenantTableNames = tables.map((t: { name: string }) => t.name).filter((n: string) => n !== 'tenants');

    const safe: string[] = [];
    const flagged: Array<{ table: string; reason: string }> = [];

    for (const tableName of nonTenantTableNames) {
      if (this.isTenantScoped(tableName, relationships, directlyScopedTables)) {
        safe.push(tableName);
      } else {
        flagged.push({
          table: tableName,
          reason:
            `Table '${tableName}' is reachable without a tenant-scoping column ` +
            `in its FK chain — queries against it may cross tenant boundaries`,
        });
      }
    }

    this.logger.log(`Isolation check: ${safe.length} safe, ${flagged.length} flagged`);
    return { safe, flagged };
  }

  /**
   * Returns true if `tableName` has a tenant-scoping column either directly
   * or transitively via any FK path that goes through a tenant-scoped table.
   */
  private isTenantScoped(
    tableName: string,
    relationships: FkRelationship[],
    directlyScopedTables: Set<string>,
  ): boolean {
    // Direct: table has a tenant_id column
    if (directlyScopedTables.has(tableName)) return true;

    // Transitive: table has a FK to a parent that is itself tenant-scoped
    // Walk FK parents recursively (cycle-safe with a visited set)
    const visited = new Set<string>();
    const stack = [tableName];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const parents = relationships
        .filter((r) => r.from === current)
        .map((r) => r.to);

      for (const parent of parents) {
        if (directlyScopedTables.has(parent)) return true;
        if (!visited.has(parent)) stack.push(parent);
      }
    }

    return false;
  }
}
