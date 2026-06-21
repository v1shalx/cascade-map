import { Injectable, Logger } from '@nestjs/common';
import { SchemaDiscoveryRepository } from './schema-discovery.repository';
import type { SchemaResponse, FkRelationship } from '@cascade-map/shared';

@Injectable()
export class SchemaDiscoveryService {
  private readonly logger = new Logger(SchemaDiscoveryService.name);

  constructor(private readonly repo: SchemaDiscoveryRepository) {}

  /**
   * Returns the full schema: tables+columns and FK adjacency list.
   * This is the data source for the initial graph render on the frontend.
   */
  async getSchema(): Promise<SchemaResponse> {
    this.logger.log('Fetching full schema');

    const [tableNames, rawColumns, relationships] = await Promise.all([
      this.repo.getTableNames(),
      this.repo.getAllColumns(),
      this.repo.getFkRelationships(),
    ]);

    const tables = this.repo.buildTableSchemas(tableNames, rawColumns);

    return { tables, relationships };
  }

  /**
   * Returns only the FK adjacency list — lighter payload for graph traversal use.
   */
  async getFkRelationships(): Promise<FkRelationship[]> {
    this.logger.log('Fetching FK relationships');
    return this.repo.getFkRelationships();
  }
}
