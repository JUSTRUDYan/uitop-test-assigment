import { IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTagDto {
  @IsString()
  @ApiPropertyOptional({ example: 'urgent' })
  title?: string;

  @IsString()
  @ApiPropertyOptional({ example: '#ff0000' })
  color?: string;
}
