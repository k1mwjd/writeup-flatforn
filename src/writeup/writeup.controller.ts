import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WriteupService } from './writeup.service';
import { CreateWriteupDto } from './dto/create-writeup.dto';
import { UpdateWriteupDto } from './dto/update-writeup.dto';
import { LikeWriteupDto } from './dto/like-writeup.dto';
import { WriteupCategory } from './writeup-category.enum';

@Controller('writeups')
export class WriteupController {
  constructor(private readonly writeupService: WriteupService) {}

  @Post()
  create(@Body() createWriteupDto: CreateWriteupDto) {
    return this.writeupService.create(createWriteupDto);
  }

  @Get()
  findAll(
    @Query('category') category?: WriteupCategory,
    @Query('keyword') keyword?: string,
  ) {
    return this.writeupService.findAll(category, keyword);
  }

  @Post(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.writeupService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWriteupDto: UpdateWriteupDto,
  ) {
    return this.writeupService.update(id, updateWriteupDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('author') author: string,
  ) {
    this.writeupService.remove(id, author);
  }

  @Post(':id/like')
  like(
    @Param('id', ParseIntPipe) id: number,
    @Body() likeWriteupDto: LikeWriteupDto,
  ) {
    return this.writeupService.like(id, likeWriteupDto);
  }
}
