import { Controller, Get, Logger, Query } from '@nestjs/common';
import { DeleteScriptService } from './delete-script.service';
import { DeleteScriptQueryDto } from './dto/delete-script-query.dto';
import type { CascadeScriptResponse } from '@cascade-map/shared';

@Controller()
export class DeleteScriptController {
  private readonly logger = new Logger(DeleteScriptController.name);

  constructor(private readonly deleteScriptService: DeleteScriptService) {}

  /**
   * GET /api/cascade/script?table=tenants&id=1&mode=hard|soft
   *
   * Runs a cascade simulation then generates a dependency-ordered SQL
   * script (children deleted before parents). Returns plain SQL text.
   */
  @Get('cascade/script')
  async generate(
    @Query() query: DeleteScriptQueryDto,
  ): Promise<CascadeScriptResponse> {
    return this.deleteScriptService.generate(query.table, query.id, query.mode);
  }
}
