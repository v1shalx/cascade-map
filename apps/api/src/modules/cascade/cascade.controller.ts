import { Controller, Get, Logger, Query } from '@nestjs/common';
import { CascadeService } from './cascade.service';
import { CascadeQueryDto } from './dto/cascade-query.dto';
import type { CascadeResponse } from '@cascade-map/shared';

@Controller()
export class CascadeController {
  private readonly logger = new Logger(CascadeController.name);

  constructor(private readonly cascadeService: CascadeService) {}

  /**
   * GET /api/cascade?table=tenants&id=1
   *
   * Runs a BFS cascade simulation starting from the given row.
   * Returns waves — one per FK hop depth — which the frontend uses
   * to animate the cascade rippling outward.
   */
  @Get('cascade')
  async simulate(@Query() query: CascadeQueryDto): Promise<CascadeResponse> {
    return this.cascadeService.simulate(query.table, query.id);
  }
}
