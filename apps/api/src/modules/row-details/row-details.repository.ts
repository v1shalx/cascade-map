import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../database/database.constants';

@Injectable()
export class RowDetailsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /**
   * Fetches a single row by id from `table`.
   * Table name is pre-validated by the service before reaching here.
   * Returns null if the row doesn't exist.
   */
  async getRow(table: string, id: number): Promise<Record<string, unknown> | null> {
    const result = await this.pool.query<Record<string, unknown>>(
      `SELECT * FROM "${table}" WHERE id = $1 LIMIT 1`,
      [id],
    );
    return result.rows[0] ?? null;
  }
}
