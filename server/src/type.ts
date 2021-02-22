import { Request, Response } from 'express'
import session from 'express-session'
import { createUpdootLoader } from './utils/createUpdootLoader'
import { createUserLoader } from './utils/createUserLoader'

export interface MyContext {
  req: Request & { session: session.Session & { userId?: number } }
  res: Response
  userLoader: ReturnType<typeof createUserLoader>
  updootLoader: ReturnType<typeof createUpdootLoader>
}
