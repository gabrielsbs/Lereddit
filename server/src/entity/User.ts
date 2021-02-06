import { Field, ObjectType } from 'type-graphql'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@ObjectType()
@Entity()
export class User {
  @Field()
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @Column({ type: 'timestamp', default: 'CURRENT_TIMESTAMP' })
  created_at: string

  @Field()
  @Column({ type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: string

  @Field()
  @Column({ unique: true })
  username: string

  @Column()
  password: string
}
