import { Request, Response } from 'express'
import session from 'express-session'
import { EntityManager } from 'typeorm'

export interface MyContext {
  entityManager: EntityManager
  req: Request & { session: session.Session & { userId?: number } }
  res: Response
}
