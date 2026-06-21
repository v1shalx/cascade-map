import { Module } from '@nestjs/common';
import { DeleteScriptController } from './delete-script.controller';
import { DeleteScriptService } from './delete-script.service';
import { CascadeModule } from '../cascade/cascade.module';

@Module({
  imports: [CascadeModule],
  controllers: [DeleteScriptController],
  providers: [DeleteScriptService],
})
export class DeleteScriptModule {}
