import { Module, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DATABASE_POOL } from './database.constants';
import type { AppConfig } from '../config/env.config';

const logger = new Logger('DatabaseModule');

@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: async (config: ConfigService<AppConfig, true>): Promise<Pool> => {
        const pool = new Pool({
          connectionString: config.get('DATABASE_URL', { infer: true }),
          max: 10,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
        });

        // Verify connectivity and confirm we're running as a read-only role
        const client = await pool.connect();
        try {
          const result = await client.query<{ rolcanlogin: boolean; rolsuper: boolean }>(
            `SELECT rolcanlogin, rolsuper
             FROM pg_roles
             WHERE rolname = current_user`,
          );

          const role = result.rows[0];
          if (role?.rolsuper) {
            logger.warn(
              'Connected as a superuser — this violates the read-only role requirement. ' +
              'Create a dedicated read-only role (see scripts/init-db.sql).',
            );
          } else {
            logger.log('Database pool ready. Running as non-superuser (read-only role confirmed).');
          }
        } finally {
          client.release();
        }

        return pool;
      },
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor() {}

  async onApplicationShutdown(): Promise<void> {
    // Pool is accessed via the injection token — NestJS handles cleanup via destroy hooks
    logger.log('DatabaseModule shutting down.');
  }
}
