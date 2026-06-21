import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.config';
import { DatabaseModule } from './database/database.module';
import { SchemaDiscoveryModule } from './modules/schema-discovery/schema-discovery.module';
import { CascadeModule } from './modules/cascade/cascade.module';
import { IsolationCheckModule } from './modules/isolation-check/isolation-check.module';
import { DeleteScriptModule } from './modules/delete-script/delete-script.module';
import { RowDetailsModule } from './modules/row-details/row-details.module';

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
    CascadeModule,
    IsolationCheckModule,
    DeleteScriptModule,
    RowDetailsModule,
  ],
})
export class AppModule {}
