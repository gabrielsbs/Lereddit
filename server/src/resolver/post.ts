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
import { getConnection, getRepository } from 'typeorm'
import { Post } from '../entity/Post'
import { Updoot } from '../entity/Updoot'
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
      select post.*, JSON_OBJECT('id', user.id, 'username', user.username, 'created_at', user.created_at) creator, ${voteStatusQuery}
      from post
      inner join user on user.id = post.creatorId
      ${
        cursor
          ? `where post.created_at < '${moment.unix(Number.parseFloat(cursor) / 1000).format('YYYY-MM-DD hh:mm:ss')}'`
          : ''
      }
      order by post.created_at DESC
      limit ${realLimitPlusOne}`

    console.log(q)

    const posts = await getConnection().query(q)

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne
    }
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id', () => Int) id: number, @Ctx() ctx: MyContext): Promise<Post | undefined> {
    const { entityManager } = ctx
    return entityManager.findOne(Post, id)
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  createPost(@Arg('input') input: PostInput, @Ctx() { req, entityManager }: MyContext): Promise<Post> {
    const post = entityManager.create(Post, {
      ...input,
      creatorId: req.session.userId
    })
    return entityManager.save(post)
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('title') title: string,
    @Ctx() ctx: MyContext
  ): Promise<Post | null> {
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

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(@Arg('postId', () => Int) postId: number, @Arg('value', () => Int) value: number, @Ctx() ctx: MyContext) {
    const { req, entityManager } = ctx
    const { userId } = req.session
    const isUp = value !== -1
    const realValue = isUp ? 1 : -1

    const post = await entityManager.findOne(Post, postId)
    if (!post) {
      return false
    }

    return await entityManager.transaction(async transaction => {
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
