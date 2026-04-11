import { IsNotEmpty, IsString } from 'class-validator';

export class LikeWriteupDto {
  @IsString()
  @IsNotEmpty()
  author: string;
}
