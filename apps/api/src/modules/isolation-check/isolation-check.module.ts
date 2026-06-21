import { Module } from '@nestjs/common';
import { IsolationCheckController } from './isolation-check.controller';
import { IsolationCheckService } from './isolation-check.service';
import { SchemaDiscoveryModule } from '../schema-discovery/schema-discovery.module';

@Module({
  imports: [SchemaDiscoveryModule],
  controllers: [IsolationCheckController],
  providers: [IsolationCheckService],
})
export class IsolationCheckModule {}
