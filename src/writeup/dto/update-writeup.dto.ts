import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { WriteupCategory } from '../writeup-category.enum';

export class UpdateWriteupDto {
  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(WriteupCategory)
  @IsOptional()
  category?: WriteupCategory;
}
