import { Module } from '@nestjs/common';
import { RowDetailsController } from './row-details.controller';
import { RowDetailsService } from './row-details.service';
import { RowDetailsRepository } from './row-details.repository';
import { DatabaseModule } from '../../database/database.module';
import { SchemaDiscoveryModule } from '../schema-discovery/schema-discovery.module';

@Module({
  imports: [DatabaseModule, SchemaDiscoveryModule],
  controllers: [RowDetailsController],
  providers: [RowDetailsService, RowDetailsRepository],
})
export class RowDetailsModule {}
