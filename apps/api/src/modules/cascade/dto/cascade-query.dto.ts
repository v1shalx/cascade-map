import { IsInt, IsString, Min } from 'class-validator';

export class CascadeQueryDto {
  @IsString()
  table!: string;

  @IsInt()
  @Min(1)
  id!: number;
}
