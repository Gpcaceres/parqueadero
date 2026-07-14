import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('persons')
export class Persona {
  @PrimaryGeneratedColumn('uuid')
  id_persona!: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ type: 'text', nullable: true })
  address!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ unique: true, length: 30 })
  dni!: string;

  @Column({ unique: true, length: 50 })
  email!: string;

  @Column({ length: 30 })
  first_name!: string;

  @Column({ length: 30 })
  last_name!: string;

  @Column({ length: 30, nullable: true })
  middle_name!: string;

  @Column({ length: 30, nullable: true })
  nationality!: string;

  @Column({ unique: true, length: 15, nullable: true })
  phone!: string;
}
