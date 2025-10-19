import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateToDoDto } from './dto/CreateToDoDto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import TagEntity from './entity/TagEntity';
import TaskEntity from './entity/TaskEntity';
import { UpdateTagDto } from './dto/UpdateTagDto';
import { UpdateToDoDto } from './dto/UpdateToDoDto';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly repository: Repository<TaskEntity>,
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>,
  ) {}

  async createTodo(createTodoDto: CreateToDoDto): Promise<TaskEntity> {
    try {
      const tag = await this.tagRepository.findOne({ where: { id: createTodoDto.tagId } });
      if (!tag) throw new BadRequestException(`Tag with id ${createTodoDto.tagId} not found`);

      const task = this.repository.create({
        title: createTodoDto.title,
        description: createTodoDto.description,
        tag,
        isDone: false,
      });

      return await this.repository.save(task);
    } catch (err) {
      console.error('TypeORM save error:', err);
      throw new InternalServerErrorException('Failed to create todo');
    }
  }

  async getToDo(todoId: number): Promise<TaskEntity> {
    const todo = await this.repository.findOne({
      where: { id: todoId },
      relations: ['tag'],
    });

    if (!todo) throw new NotFoundException(`Todo with id ${todoId} not found`);
    return todo;
  }

  async getToDos(): Promise<TaskEntity[]> {
    return this.repository.find({ relations: ['tag'] });
  }

  async removeTodo(todoId: number): Promise<TaskEntity> {
    const todo = await this.repository.findOne({ where: { id: todoId } });
    if (!todo) throw new NotFoundException(`Todo with id ${todoId} not found`);
    return this.repository.remove(todo);
  }

  async updateTodo(
    todoId: number,
    updates: UpdateToDoDto,
  ): Promise<TaskEntity> {
    const todo = await this.repository.findOne({ where: { id: todoId }, relations: ['tag'] });
    if (!todo) throw new NotFoundException(`Todo with id ${todoId} not found`);

    if (updates.title) todo.title = updates.title;
    if (updates.description) todo.description = updates.description;
    if (typeof updates.isDone === 'boolean') todo.isDone = updates.isDone;

    if (updates.tagId) {
      const tag = await this.tagRepository.findOne({ where: { id: updates.tagId } });
      if (!tag) throw new BadRequestException(`Tag with id ${updates.tagId} not found`);
      todo.tag = tag;
    }

    return this.repository.save(todo);
  }

  async getTags(): Promise<TagEntity[]> {
    return await this.tagRepository.find();
  }

  async getTag(tagId: number): Promise<TagEntity> {
    const tag =  await this.tagRepository.findOne({ where: { id: tagId } });
    if (!tag) throw new NotFoundException(`tag with id ${tagId} not found`);
    return tag;
  }

  async updateTag(tagId: number, updates: UpdateTagDto): Promise<TagEntity> {
    const tag = await this.tagRepository.findOne({ where: { id: tagId } });
    if (!tag) throw new NotFoundException(`Tag with id ${tagId} not found`);

    if (updates.title) tag.title = updates.title;
    if (updates.color) tag.color = updates.color;

    return this.tagRepository.save(tag);
  }
}
