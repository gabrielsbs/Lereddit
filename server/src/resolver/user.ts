import argon2 from 'argon2'
import { MyContext } from 'src/type'
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from 'type-graphql'
import { getRepository } from 'typeorm'
import { COOKIE_NAME } from '../../src/constants'
import { User } from '../entity/User'

@InputType()
class UserInfo {
  @Field()
  username: string

  @Field()
  password: string
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@ObjectType()
class FieldError {
  @Field()
  field: string
  @Field()
  message: string
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext): Promise<User | null | undefined> {
    const userRepository = getRepository(User)

    if (!req.session.userId) {
      return null
    }
    const user = await userRepository.findOne(req.session.userId)
    return user
  }

  @Mutation(() => UserResponse)
  async register(@Arg('userInfo') userInfo: UserInfo, @Ctx() { req }: MyContext): Promise<UserResponse> {
    if (userInfo.username.length <= 2) {
      return {
        errors: [
          {
            field: 'username',
            message: 'length must be greater than 2'
          }
        ]
      }
    }
    if (userInfo.password.length <= 2) {
      return {
        errors: [
          {
            field: 'password',
            message: 'length must be greater than 2'
          }
        ]
      }
    }
    const userRepository = getRepository(User)
    const hashedPassword = await argon2.hash(userInfo.password)
    const user = userRepository.create({ username: userInfo.username, password: hashedPassword })
    try {
      const userSaved = await userRepository.save(user)
      req.session.userId = userSaved.id
      return {
        user: userSaved
      }
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return {
          errors: [
            {
              field: 'username',
              message: `Username has already been taken`
            }
          ]
        }
      }
      return {
        errors: [
          {
            field: 'username',
            message: `Failed to persist user. Error: ${e.message}`
          }
        ]
      }
    }
  }

  @Mutation(() => UserResponse)
  async login(@Arg('userInfo') userInfo: UserInfo, @Ctx() { req }: MyContext): Promise<UserResponse> {
    const userRepository = getRepository(User)
    const user = await userRepository.findOne({ username: userInfo.username })
    if (!user) {
      return {
        errors: [
          {
            field: 'username',
            message: 'Could not find username'
          }
        ]
      }
    }
    const valid = await argon2.verify(user.password, userInfo.password)
    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'Wrong password'
          }
        ]
      }
    }

    req.session.userId = user.id
    return {
      user
    }
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext): Promise<boolean> {
    return new Promise(resolve =>
      req.session.destroy(err => {
        if (err) {
          console.log(err)
          resolve(false)
          return
        }
        res.clearCookie(COOKIE_NAME)
        resolve(true)
      })
    )
  }
}
