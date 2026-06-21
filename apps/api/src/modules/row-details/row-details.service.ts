import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SchemaDiscoveryRepository } from '../schema-discovery/schema-discovery.repository';
import { RowDetailsRepository } from './row-details.repository';
import type { RowDetailsResponse } from '@cascade-map/shared';

@Injectable()
export class RowDetailsService {
  private readonly logger = new Logger(RowDetailsService.name);

  constructor(
    private readonly rowDetailsRepo: RowDetailsRepository,
    private readonly schemaRepo: SchemaDiscoveryRepository,
  ) {}

  async getRow(table: string, id: number): Promise<RowDetailsResponse> {
    // Validate table name against information_schema before use
    const tableValid = await this.schemaRepo.tableExists(table);
    if (!tableValid) {
      throw new BadRequestException(`Table '${table}' does not exist in this schema`);
    }

    const row = await this.rowDetailsRepo.getRow(table, id);
    if (!row) {
      throw new NotFoundException(`Row with id=${id} not found in table '${table}'`);
    }

    return row;
  }
}
