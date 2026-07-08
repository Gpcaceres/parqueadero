import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('user_role')
export class UserRole {
  @PrimaryColumn('uuid')
  id_user!: string;

  @PrimaryColumn('uuid')
  id_role!: string;

  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_user' })
  user!: User;

  @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_role' })
  role!: Role;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  assigned_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
