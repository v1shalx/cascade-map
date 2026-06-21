import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.config';
import { DatabaseModule } from './database/database.module';
import { SchemaDiscoveryModule } from './modules/schema-discovery/schema-discovery.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      // In production, DATABASE_URL is injected by the platform; .env is dev-only
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    SchemaDiscoveryModule,
    // Phase 2 modules added here: CascadeModule, IsolationCheckModule, DeleteScriptModule
  ],
})
export class AppModule {}
