import { MyContext } from 'src/type'
import { Arg, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { getRepository } from 'typeorm'
import { Post } from '../entity/Post'

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  posts(@Ctx() ctx: MyContext): Promise<Post[]> {
    const { entityManager } = ctx
    return entityManager.find(Post)
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id', () => Int) id: number, @Ctx() ctx: MyContext): Promise<Post | undefined> {
    const { entityManager } = ctx
    return entityManager.findOne(Post, id)
  }

  @Mutation(() => Post)
  createPost(@Arg('title') title: string, @Ctx() ctx: MyContext): Promise<Post> {
    const { entityManager } = ctx
    const post = entityManager.create(Post, { title })
    return entityManager.save(post)
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(@Arg('id', () => Int) id: number, @Arg('title') title: string, @Ctx() ctx: MyContext): Promise<Post | null> {
    const { entityManager } = ctx
    const post = await entityManager.findOne(Post, id)
    if (!post) {
      return null
    }
    post.title = title
    return entityManager.save(post)
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg('id', () => Int) id: number): Promise<boolean> {
    const postRepository = getRepository(Post)
    try {
      postRepository.delete(id)
      return true
    } catch (error) {
      return false
    }
  }
}
