import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Persona } from './persona.entity';
import { UserRole } from './user-role.entity';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id_person: string;

  @OneToOne(() => Persona)
  @JoinColumn({ name: 'id_person' })
  persona: Persona;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;

  @Column({ length: 255 })
  password_hash: string;

  @Column({ unique: true, length: 15 })
  username: string;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];
}
