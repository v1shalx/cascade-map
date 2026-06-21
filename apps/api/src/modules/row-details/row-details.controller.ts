import { Controller, Get, Logger, Query } from '@nestjs/common';
import { RowDetailsService } from './row-details.service';
import { RowDetailsQueryDto } from './dto/row-details-query.dto';
import type { RowDetailsResponse } from '@cascade-map/shared';

@Controller()
export class RowDetailsController {
  private readonly logger = new Logger(RowDetailsController.name);

  constructor(private readonly rowDetailsService: RowDetailsService) {}

  /**
   * GET /api/row-details?table=users&id=3
   *
   * Returns a single row's data for the click-to-inspect popup on the frontend.
   * Validates table name against information_schema before querying.
   */
  @Get('row-details')
  async getRow(@Query() query: RowDetailsQueryDto): Promise<RowDetailsResponse> {
    return this.rowDetailsService.getRow(query.table, query.id);
  }
}
