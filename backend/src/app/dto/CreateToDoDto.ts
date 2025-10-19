import { IsString, IsOptional, Length, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateToDoDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @ApiProperty({ example: 'Buy milk', description: 'Title of the todo' })
  title!: string;


  @ApiProperty({ example: 1, description: 'id of the todo tag' })
  tagId!: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Remember to buy milk', description: 'Description of the todo' })
  description?: string;
}
