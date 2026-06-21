import { Controller, Get, Logger } from '@nestjs/common';
import { IsolationCheckService } from './isolation-check.service';
import type { IsolationCheckResponse } from '@cascade-map/shared';

@Controller()
export class IsolationCheckController {
  private readonly logger = new Logger(IsolationCheckController.name);

  constructor(private readonly isolationCheckService: IsolationCheckService) {}

  /**
   * GET /api/isolation-check
   *
   * Walks the FK graph and flags tables reachable without a tenant-scoping
   * column in the chain — a real multi-tenant data-leak bug class.
   */
  @Get('isolation-check')
  async check(): Promise<IsolationCheckResponse> {
    return this.isolationCheckService.check();
  }
}
