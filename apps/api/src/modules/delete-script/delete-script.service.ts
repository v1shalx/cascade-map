import { Injectable, Logger } from '@nestjs/common';
import { CascadeService } from '../cascade/cascade.service';
import { DeleteMode } from './dto/delete-script-query.dto';
import type { CascadeScriptResponse, CascadeWave } from '@cascade-map/shared';

/**
 * Generates a safe, dependency-ordered SQL script from a cascade simulation.
 *
 * Correctness requirement: children must be deleted before parents.
 * The cascade waves are already in BFS order (parents first, children deeper),
 * so we reverse them to get children-first deletion order, then append
 * the root row delete last.
 */
@Injectable()
export class DeleteScriptService {
  private readonly logger = new Logger(DeleteScriptService.name);

  constructor(private readonly cascadeService: CascadeService) {}

  async generate(
    table: string,
    id: number,
    mode: DeleteMode,
  ): Promise<CascadeScriptResponse> {
    this.logger.log(`Generating ${mode}-delete script for ${table}#${id}`);

    const simulation = await this.cascadeService.simulate(table, id);

    // Reverse waves so deepest children are deleted first
    const orderedWaves = [...simulation.waves].reverse();

    const lines: string[] = [
      '-- cascade-map generated safe-delete script',
      `-- Root: ${table} id=${id}`,
      `-- Total rows affected: ${simulation.totalAffected}`,
      `-- Mode: ${mode === DeleteMode.HARD ? 'hard delete (DELETE)' : 'soft delete (SET deleted_at)'}`,
      `-- Generated at: ${new Date().toISOString()}`,
      '',
      'BEGIN;',
      '',
    ];

    for (const wave of orderedWaves) {
      lines.push(...this.buildWaveStatements(wave, mode));
    }

    // Root row last
    lines.push(...this.buildRootStatement(table, id, mode));
    lines.push('');
    lines.push('COMMIT;');

    return {
      mode,
      sql: lines.join('\n'),
    };
  }

  private buildWaveStatements(wave: CascadeWave, mode: DeleteMode): string[] {
    const idList = wave.ids.join(', ');
    const truncationNote = wave.truncated
      ? `-- ⚠ truncated: only first ${wave.ids.length} rows shown; re-run for full delete\n`
      : '';

    if (mode === DeleteMode.HARD) {
      return [
        `-- depth ${wave.depth}: ${wave.table}`,
        `${truncationNote}DELETE FROM "${wave.table}" WHERE id IN (${idList});`,
        '',
      ];
    }

    // Soft delete — only works if the table has a deleted_at column
    return [
      `-- depth ${wave.depth}: ${wave.table}`,
      `${truncationNote}UPDATE "${wave.table}"`,
      `  SET deleted_at = NOW()`,
      `  WHERE id IN (${idList});`,
      '',
    ];
  }

  private buildRootStatement(
    table: string,
    id: number,
    mode: DeleteMode,
  ): string[] {
    if (mode === DeleteMode.HARD) {
      return [
        `-- root: ${table}`,
        `DELETE FROM "${table}" WHERE id = ${id};`,
      ];
    }
    return [
      `-- root: ${table}`,
      `UPDATE "${table}"`,
      `  SET deleted_at = NOW()`,
      `  WHERE id = ${id};`,
    ];
  }
}
