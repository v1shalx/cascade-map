import { Module } from '@nestjs/common';
import { SchemaDiscoveryController } from './schema-discovery.controller';
import { SchemaDiscoveryService } from './schema-discovery.service';
import { SchemaDiscoveryRepository } from './schema-discovery.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SchemaDiscoveryController],
  providers: [SchemaDiscoveryService, SchemaDiscoveryRepository],
  // Export service so other modules (cascade, isolation-check) can reuse tableExists()
  exports: [SchemaDiscoveryService, SchemaDiscoveryRepository],
})
export class SchemaDiscoveryModule {}
