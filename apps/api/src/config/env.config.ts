import { IsInt, IsString, IsUrl, Max, Min, validateSync } from 'class-validator';
import type { ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

class EnvironmentVariables {
  @IsUrl({ require_tld: false }, { message: 'DATABASE_URL must be a valid PostgreSQL connection string' })
  DATABASE_URL!: string;

  @IsInt()
  @Min(1024)
  @Max(65535)
  PORT: number = 3001;

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:5173';

  @IsInt()
  @Min(1)
  @Max(10)
  MAX_TRAVERSAL_DEPTH: number = 5;

  @IsInt()
  @Min(1)
  @Max(5000)
  MAX_ROWS_PER_TABLE: number = 500;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((e: ValidationError) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n');
    throw new Error(`Environment validation failed:\n${messages}`);
  }

  return validatedConfig;
}

export type AppConfig = EnvironmentVariables;
