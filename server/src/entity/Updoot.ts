import { Field, ObjectType } from 'type-graphql'
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm'
import { Post } from './Post'
import { User } from './User'

@ObjectType()
@Entity()
export class Updoot extends BaseEntity {
  @Column({ type: 'int' })
  sum: number

  @PrimaryColumn()
  @Field()
  userId: number

  @Field(() => User)
  @ManyToOne(() => User, user => user.updoots)
  user: User

  @PrimaryColumn()
  @Field()
  postId: number

  @Field(() => Post)
  @ManyToOne(() => Post, post => post.updoots)
  post: Post
}
