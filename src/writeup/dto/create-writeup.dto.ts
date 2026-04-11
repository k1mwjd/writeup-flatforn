import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { WriteupCategory } from '../writeup-category.enum';

export class CreateWriteupDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsEnum(WriteupCategory)
  category!: WriteupCategory;
}
