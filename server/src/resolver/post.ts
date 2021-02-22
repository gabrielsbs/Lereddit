import moment from 'moment'
import { MyContext } from 'src/type'
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware
} from 'type-graphql'
import { getConnection, getManager } from 'typeorm'
import { Post } from '../entity/Post'
import { Updoot } from '../entity/Updoot'
import { User } from '../entity/User'
import { isAuth } from '../middleware/isAuth'

@InputType()
class PostInput {
  @Field()
  title: string

  @Field()
  text: string
}

@ObjectType()
class PaginatedPost {
  @Field(() => [Post])
  posts: Post[]
  @Field()
  hasMore: boolean
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50)
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId)
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(@Root() post: Post, @Ctx() { updootLoader, req }: MyContext) {
    if (!req.session.userId) {
      return null
    }
    const updoot = await updootLoader.load({ postId: post.id, userId: req.session.userId })
    return updoot ? updoot.sum : null
  }

  @Query(() => PaginatedPost)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPost> {
    const realLimit = Math.min(50, limit)
    const realLimitPlusOne = realLimit + 1

    const { userId } = req.session
    const replacements: (string | number)[] = [realLimitPlusOne]

    if (cursor) {
      replacements.push(cursor)
    }
    const voteStatusQuery = userId
      ? `(select sum from updoot where userId=${userId} and postId = post.id) voteStatus`
      : 'null as voteStatus'
    const q = `
      select post.*, ${voteStatusQuery}
      from post
      ${
        cursor
          ? `where post.created_at < '${moment.unix(Number.parseFloat(cursor) / 1000).format('YYYY-MM-DD hh:mm:ss')}'`
          : ''
      }
      order by post.created_at DESC
      limit ${realLimitPlusOne}`

    const posts = await getConnection().query(q)

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne
    }
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id)
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  createPost(@Arg('input') input: PostInput, @Ctx() { req }: MyContext): Promise<Post> {
    const post = Post.create({
      ...input,
      creatorId: req.session.userId
    })
    return Post.save(post)
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('title') title: string,
    @Arg('text') text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | undefined> {
    const post = await Post.findOne(id)
    if (!post) {
      throw new Error('Post not found')
    }

    if (post.creatorId !== req.session.userId) {
      throw new Error('Not authorized')
    }

    post.title = title
    post.text = text
    return Post.save(post)
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(@Arg('id', () => Int) id: number, @Ctx() { req }: MyContext): Promise<boolean | undefined> {
    const post = await Post.findOne(id)
    if (!post) {
      throw new Error('Post not found')
    }
    if (post.creatorId !== req.session.userId) {
      throw new Error('Not authorized')
    }
    Updoot.delete({ postId: id })
    Post.delete({ id })
    return true
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(@Arg('postId', () => Int) postId: number, @Arg('value', () => Int) value: number, @Ctx() ctx: MyContext) {
    const { req } = ctx
    const { userId } = req.session
    const isUp = value !== -1
    const realValue = isUp ? 1 : -1

    const post = await Post.findOne(postId)
    if (!post) {
      return false
    }

    return await getManager().transaction(async transaction => {
      try {
        const updoot = await transaction.findOne(Updoot, { where: { postId, userId } })
        const vote = transaction.create(Updoot, {
          userId,
          postId,
          sum: realValue
        })
        await transaction.save(vote)

        if (updoot && updoot.sum !== realValue) {
          post.points = post.points + realValue * 2
          await transaction.save(post)
        } else if (!updoot) {
          post.points = post.points + realValue
          await transaction.save(post)
        }

        return true
      } catch (e) {
        transaction.queryRunner?.rollbackTransaction()
        return false
      }
    })
  }
}
