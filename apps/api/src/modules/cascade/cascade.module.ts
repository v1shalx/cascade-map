import { Module } from '@nestjs/common';
import { CascadeController } from './cascade.controller';
import { CascadeService } from './cascade.service';
import { CascadeRepository } from './cascade.repository';
import { DatabaseModule } from '../../database/database.module';
import { SchemaDiscoveryModule } from '../schema-discovery/schema-discovery.module';

@Module({
  imports: [DatabaseModule, SchemaDiscoveryModule],
  controllers: [CascadeController],
  providers: [CascadeService, CascadeRepository],
  // Export service so DeleteScriptModule can reuse simulate()
  exports: [CascadeService],
})
export class CascadeModule {}
