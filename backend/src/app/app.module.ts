import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import TaskEntity from './entity/TaskEntity';
import TagEntity from './entity/TagEntity';
import {DataSource} from "typeorm";

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'db.sqlite',
  entities: [TaskEntity, TagEntity],
  synchronize: true,
});


@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    TypeOrmModule.forFeature([TaskEntity, TagEntity]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
