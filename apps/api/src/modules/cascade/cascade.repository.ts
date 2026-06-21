import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../database/database.constants';
import type { FkRelationship } from '@cascade-map/shared';

interface ChildCountRow {
  count: string; // pg returns bigint counts as strings
}

interface ChildIdRow {
  id: number;
}

/**
 * All raw SQL for cascade traversal lives here.
 * Table/column names are validated against information_schema by the service
 * before being passed here — never trust them directly.
 */
@Injectable()
export class CascadeRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /**
   * Counts how many rows in `childTable` reference any of `parentIds`
   * via `fkColumn`. Used to detect truncation before fetching.
   */
  async countChildRows(
    childTable: string,
    fkColumn: string,
    parentIds: number[],
  ): Promise<number> {
    // Table/column names are pre-validated by the service — safe to interpolate
    const result = await this.pool.query<ChildCountRow>(
      // We must use identifier quoting since these come from information_schema validation
      `SELECT COUNT(*) AS count
       FROM "${childTable}"
       WHERE "${fkColumn}" = ANY($1::int[])`,
      [parentIds],
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  /**
   * Fetches up to `limit` IDs from `childTable` where `fkColumn` matches
   * any of `parentIds`.
   */
  async getChildIds(
    childTable: string,
    fkColumn: string,
    parentIds: number[],
    limit: number,
  ): Promise<number[]> {
    const result = await this.pool.query<ChildIdRow>(
      `SELECT id
       FROM "${childTable}"
       WHERE "${fkColumn}" = ANY($1::int[])
       LIMIT $2`,
      [parentIds, limit],
    );
    return result.rows.map((r: ChildIdRow) => r.id);
  }

  /**
   * Confirms a specific row exists in `table` with `id`.
   * Called before starting traversal to give a clean 404 if the root row is missing.
   */
  async rootRowExists(table: string, id: number): Promise<boolean> {
    const result = await this.pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM "${table}" WHERE id = $1
       ) AS exists`,
      [id],
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Returns all FK relationships where the referenced (parent) table is one
   * of the given tables — i.e., what points AT these tables.
   * Drives BFS outward expansion.
   */
  async getFkRelationshipsPointingTo(
    parentTables: string[],
  ): Promise<FkRelationship[]> {
    const result = await this.pool.query<{
      from_table: string;
      from_col: string;
      to_table: string;
      to_col: string;
      on_delete: string;
    }>(
      `SELECT
         kcu.table_name   AS from_table,
         kcu.column_name  AS from_col,
         ccu.table_name   AS to_table,
         ccu.column_name  AS to_col,
         rc.delete_rule   AS on_delete
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON kcu.constraint_name  = tc.constraint_name
        AND kcu.constraint_schema = tc.constraint_schema
       JOIN information_schema.referential_constraints rc
         ON rc.constraint_name  = tc.constraint_name
        AND rc.constraint_schema = tc.constraint_schema
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name  = rc.unique_constraint_name
        AND ccu.constraint_schema = rc.unique_constraint_schema
       WHERE tc.constraint_type   = 'FOREIGN KEY'
         AND tc.constraint_schema = 'public'
         AND ccu.table_name = ANY($1)`,
      [parentTables],
    );

    return result.rows.map((row: { from_table: string; from_col: string; to_table: string; to_col: string; on_delete: string }) => ({
      from: row.from_table,
      fromCol: row.from_col,
      to: row.to_table,
      toCol: row.to_col,
      onDelete: row.on_delete as FkRelationship['onDelete'],
    }));
  }
}
