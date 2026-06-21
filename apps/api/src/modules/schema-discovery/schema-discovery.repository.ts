import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../database/database.constants';
import type { FkRelationship, TableSchema, ColumnInfo } from '@cascade-map/shared';

interface RawFkRow {
  from_table: string;
  from_col: string;
  to_table: string;
  to_col: string;
  on_delete: string;
}

interface RawColumnRow {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

/**
 * All raw SQL for schema discovery lives here.
 * Services never write SQL inline.
 */
@Injectable()
export class SchemaDiscoveryRepository {
  private readonly logger = new Logger(SchemaDiscoveryRepository.name);

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /**
   * Returns all tables in the public schema.
   */
  async getTableNames(): Promise<string[]> {
    const result = await this.pool.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
    );
    return result.rows.map((r: { table_name: string }) => r.table_name);
  }

  /**
   * Returns columns for every table in the public schema.
   * Groups by table_name so the service can build TableSchema objects.
   */
  async getAllColumns(): Promise<RawColumnRow[]> {
    const result = await this.pool.query<RawColumnRow>(
      `SELECT
         c.table_name,
         c.column_name,
         c.data_type,
         c.is_nullable,
         c.column_default
       FROM information_schema.columns c
       JOIN information_schema.tables t
         ON t.table_name = c.table_name
        AND t.table_schema = c.table_schema
       WHERE c.table_schema = 'public'
         AND t.table_type = 'BASE TABLE'
       ORDER BY c.table_name, c.ordinal_position`,
    );
    return result.rows;
  }

  /**
   * Returns all FK relationships in the public schema, including ON DELETE behavior.
   */
  async getFkRelationships(): Promise<FkRelationship[]> {
    const result = await this.pool.query<RawFkRow>(
      `SELECT
         kcu.table_name         AS from_table,
         kcu.column_name        AS from_col,
         ccu.table_name         AS to_table,
         ccu.column_name        AS to_col,
         rc.delete_rule         AS on_delete
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON kcu.constraint_name = tc.constraint_name
        AND kcu.constraint_schema = tc.constraint_schema
       JOIN information_schema.referential_constraints rc
         ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.constraint_schema
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = rc.unique_constraint_name
        AND ccu.constraint_schema = rc.unique_constraint_schema
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND tc.constraint_schema = 'public'
       ORDER BY from_table, from_col`,
    );

    return result.rows.map((row: RawFkRow) => ({
      from: row.from_table,
      fromCol: row.from_col,
      to: row.to_table,
      toCol: row.to_col,
      onDelete: this.normalizeOnDelete(row.on_delete),
    }));
  }

  /**
   * Validates that `tableName` actually exists in information_schema before use.
   * Call this before using a user-supplied table name in any query.
   */
  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_type = 'BASE TABLE'
           AND table_name = $1
       ) AS exists`,
      [tableName],
    );
    return result.rows[0]?.exists ?? false;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private normalizeOnDelete(raw: string): FkRelationship['onDelete'] {
    const map: Record<string, FkRelationship['onDelete']> = {
      CASCADE: 'CASCADE',
      'SET NULL': 'SET NULL',
      'SET DEFAULT': 'SET DEFAULT',
      RESTRICT: 'RESTRICT',
      'NO ACTION': 'NO ACTION',
    };
    return map[raw.toUpperCase()] ?? 'NO ACTION';
  }

  /**
   * Groups raw column rows into TableSchema objects.
   * Pure data transformation — no SQL here.
   */
  buildTableSchemas(
    tableNames: string[],
    rawColumns: RawColumnRow[],
  ): TableSchema[] {
    const columnsByTable = new Map<string, ColumnInfo[]>();

    for (const name of tableNames) {
      columnsByTable.set(name, []);
    }

    for (const row of rawColumns) {
      const cols = columnsByTable.get(row.table_name);
      if (cols) {
        cols.push({
          name: row.column_name,
          dataType: row.data_type,
          isNullable: row.is_nullable === 'YES',
          columnDefault: row.column_default,
        });
      }
    }

    return tableNames.map((name) => ({
      name,
      columns: columnsByTable.get(name) ?? [],
    }));
  }
}
