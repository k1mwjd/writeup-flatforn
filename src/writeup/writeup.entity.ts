import { WriteupCategory } from './writeup-category.enum';

export class Writeup {
  id: number;
  title: string;
  content: string;
  author: string;
  category: WriteupCategory;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}
