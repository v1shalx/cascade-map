import { IsEnum, IsInt, IsString, Min } from 'class-validator';

export enum DeleteMode {
  HARD = 'hard',
  SOFT = 'soft',
}

export class DeleteScriptQueryDto {
  @IsString()
  table!: string;

  @IsInt()
  @Min(1)
  id!: number;

  @IsEnum(DeleteMode)
  mode!: DeleteMode;
}
