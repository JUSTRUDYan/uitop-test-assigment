import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export default class TagEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  color!: string;
}
