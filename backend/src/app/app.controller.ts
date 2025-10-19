import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';
import { CreateToDoDto } from './dto/CreateToDoDto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import TaskEntity from './entity/TaskEntity';
import TagEntity from './entity/TagEntity';
import { UpdateToDoDto } from './dto/UpdateToDoDto';
import { UpdateTagDto } from './dto/UpdateTagDto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @ApiTags('todos')
  @Post("/todos")
  @ApiOperation({ summary: 'Create a new todo task' })
  @ApiBody({ type: CreateToDoDto })
  @ApiResponse({ status: 201, description: 'Todo successfully created', type: TaskEntity })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async postToDo(@Body() createTodoDto: CreateToDoDto) {
    return await this.appService.createTodo(createTodoDto);
  }

  @ApiTags('todos')
  @Get("/todos")
  @ApiOperation({ summary: 'Get all todo tasks' })
  async getAllToDos() {
    return this.appService.getToDos();
  }

  @ApiTags('todos')
  @Get('/todos/:id')
  @ApiOperation({ summary: 'Get a todo task by its id' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the todo to get', example: 1 })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async getTodo(@Param('id') todoId: number) {
    return this.appService.getToDo(todoId);
  }

  @ApiTags('todos')
  @Delete('/todos/:id')
  @ApiOperation({ summary: 'Delete a todo task by its id' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the todo to remove', example: 1 })
  @ApiResponse({ status: 200, description: 'Todo successfully removed', type: TaskEntity })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async removeTodo(@Param('id') todoId: number) {
    return this.appService.removeTodo(todoId);
  }

  @ApiTags('todos')
  @Patch('/todos/:id')
  @ApiOperation({ summary: 'Update a todo task (title, description, tagId, isDone)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the todo to update', example: 1 })
  @ApiBody({ type: UpdateToDoDto })
  @ApiResponse({ status: 200, description: 'Todo successfully updated', type: TaskEntity })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async updateTodo(@Param('id') todoId: number, @Body() updates: UpdateToDoDto) {
    return this.appService.updateTodo(todoId, updates);
  }

  @ApiTags('tags')
  @Get('/tags')
  @ApiOperation({ summary: 'Get all tags' })
  async getAllTags() {
    console.log('Getting all tags');
    return this.appService.getTags();
  }

  @ApiTags('tags')
  @Get('/tags/:id')
  @ApiParam({ name: 'id', type: Number, description: 'ID of the tag', example: 1 })
  @ApiOperation({ summary: 'Get tag by id' })
  async getTag(@Param('id') id: number) {
    return this.appService.getTag(id);
  }

  @ApiTags('tags')
  @Post('/tags')
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiBody({
    schema: {
      example: {
        title: 'urgent',
        color: '#ff0000',
      },
    },
  })
  async createTag(@Body() body: { title: string; color: string }) {
    const tag = new TagEntity();
    tag.title = body.title;
    tag.color = body.color;
    return this.appService['tagRepository'].save(tag);
  }

  @ApiTags('tags')
  @Patch('/tags/:id')
  @ApiOperation({ summary: 'Update a tag (title, color)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the tag to update', example: 1 })
  @ApiBody({ type: UpdateTagDto })
  @ApiResponse({ status: 200, description: 'Tag successfully updated', type: TagEntity })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async updateTag(@Param('id') tagId: number, @Body() updates: UpdateTagDto) {
    return this.appService.updateTag(tagId, updates);
  }
}
