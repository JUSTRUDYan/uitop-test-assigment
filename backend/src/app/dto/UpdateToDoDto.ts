import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateToDoDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Buy bread' })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Remember to buy bread' })
  description?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: true })
  isDone?: boolean;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ example: 2 })
  tagId?: number;
}
