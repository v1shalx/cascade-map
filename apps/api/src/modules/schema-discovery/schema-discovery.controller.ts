import { Controller, Get, Logger } from '@nestjs/common';
import { SchemaDiscoveryService } from './schema-discovery.service';
import type { SchemaResponse, FkRelationship } from '@cascade-map/shared';

/**
 * Controllers only: validate input (via DTOs/pipes) → call service → return result.
 * No business logic here.
 */
@Controller()
export class SchemaDiscoveryController {
  private readonly logger = new Logger(SchemaDiscoveryController.name);

  constructor(private readonly schemaDiscoveryService: SchemaDiscoveryService) {}

  /**
   * GET /api/schema
   * Full schema: tables, columns, FK relationships.
   * Powers the initial graph render on the frontend.
   */
  @Get('schema')
  async getSchema(): Promise<SchemaResponse> {
    return this.schemaDiscoveryService.getSchema();
  }

  /**
   * GET /api/fk-graph
   * Lightweight FK adjacency list only.
   */
  @Get('fk-graph')
  async getFkGraph(): Promise<FkRelationship[]> {
    return this.schemaDiscoveryService.getFkRelationships();
  }
}
