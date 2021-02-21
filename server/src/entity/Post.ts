import { Field, Int, ObjectType } from 'type-graphql'
import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Updoot } from './Updoot'
import { User } from './User'

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @Column({ type: 'text' })
  title!: string

  @Field()
  @Column({ type: 'text' })
  text!: string

  @Field()
  @Column({ type: 'int', default: 0 })
  points!: number

  @Field(() => Int, { nullable: true })
  voteStatus: number | null

  @Column()
  @Field()
  creatorId: number

  @Field()
  @ManyToOne(() => User, user => user.posts)
  creator: User

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: string

  @Field()
  @Column('timestamp', {
    default: () => 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  })
  updated_at: string

  @OneToMany(() => Updoot, updoot => updoot.post)
  updoots: Updoot[]
}
