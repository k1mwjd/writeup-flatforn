import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Writeup } from './writeup.entity';
import { CreateWriteupDto } from './dto/create-writeup.dto';
import { UpdateWriteupDto } from './dto/update-writeup.dto';
import { LikeWriteupDto } from './dto/like-writeup.dto';
import { WriteupCategory } from './writeup-category.enum';

@Injectable()
export class WriteupService {
  private writeups: Writeup[] = [];
  private idCounter = 1;

  create(createWriteupDto: CreateWriteupDto): Writeup {
    const now = new Date();
    const writeup: Writeup = {
      id: this.idCounter++,
      title: createWriteupDto.title,
      content: createWriteupDto.content,
      author: createWriteupDto.author,
      category: createWriteupDto.category,
      views: 0,
      likes: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.writeups.push(writeup);
    return writeup;
  }

  findAll(category?: WriteupCategory, keyword?: string): Writeup[] {
    let result = [...this.writeups];

    if (category) {
      result = result.filter((w) => w.category === category);
    }

    if (keyword) {
      const lower = keyword.toLowerCase();
      result = result.filter(
        (w) =>
          w.title.toLowerCase().includes(lower) ||
          w.content.toLowerCase().includes(lower),
      );
    }

    return result;
  }

  findOne(id: number): Writeup {
    const writeup = this.writeups.find((w) => w.id === id);
    if (!writeup) {
      throw new NotFoundException(`ID ${id}인 라이트업을 찾을 수 없습니다.`);
    }
    writeup.views += 1;
    return writeup;
  }

  update(id: number, updateWriteupDto: UpdateWriteupDto): Writeup {
    const writeup = this.writeups.find((w) => w.id === id);
    if (!writeup) {
      throw new NotFoundException(`ID ${id}인 라이트업을 찾을 수 없습니다.`);
    }
    if (writeup.author !== updateWriteupDto.author) {
      throw new ForbiddenException('수정 권한이 없습니다.');
    }

    if (updateWriteupDto.title !== undefined) writeup.title = updateWriteupDto.title;
    if (updateWriteupDto.content !== undefined) writeup.content = updateWriteupDto.content;
    if (updateWriteupDto.category !== undefined) writeup.category = updateWriteupDto.category;
    writeup.updatedAt = new Date();

    return writeup;
  }

  remove(id: number, author: string): void {
    const index = this.writeups.findIndex((w) => w.id === id);
    if (index === -1) {
      throw new NotFoundException(`ID ${id}인 라이트업을 찾을 수 없습니다.`);
    }
    if (this.writeups[index].author !== author) {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }
    this.writeups.splice(index, 1);
  }

  like(id: number, likeWriteupDto: LikeWriteupDto): Writeup {
    const writeup = this.writeups.find((w) => w.id === id);
    if (!writeup) {
      throw new NotFoundException(`ID ${id}인 라이트업을 찾을 수 없습니다.`);
    }
    writeup.likes += 1;
    return writeup;
  }
}
