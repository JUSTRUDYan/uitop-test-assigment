import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import TagEntity from './TagEntity';

@Entity()
export default class TaskEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @ManyToOne(() => TagEntity, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn()
  tag!: TagEntity;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: false })
  isDone!: boolean;
}
