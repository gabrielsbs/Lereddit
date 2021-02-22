import { ApolloServer } from 'apollo-server-express'
import connectRedis from 'connect-redis'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import redis from 'redis'
import 'reflect-metadata'
import { buildSchema } from 'type-graphql'
import { createConnection } from 'typeorm'
import { COOKIE_NAME } from './constants'
import { HelloResolver } from './resolver/hello'
import { PostResolver } from './resolver/post'
import { UserResolver } from './resolver/user'
import { MyContext } from './type'
import { createUpdootLoader } from './utils/createUpdootLoader'
import { createUserLoader } from './utils/createUserLoader'

const port = 4000
const app = express()

createConnection().then(async () => {
  app.use(express.json())
  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true
    })
  )

  const RedisStore = connectRedis(session)
  const redisClient = redis.createClient()

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redisClient, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: 'lax'
      },
      saveUninitialized: false,
      secret: 'QUVa9DJeIY',
      resave: false
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }): MyContext => ({
      req,
      res,
      userLoader: createUserLoader(),
      updootLoader: createUpdootLoader()
    })
  })
  apolloServer.applyMiddleware({ app, cors: false })
})
app.listen(port, () => console.log(`Server started in port ${port}`))
