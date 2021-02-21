import { MyContext } from "src/type";
import { MiddlewareFn } from "type-graphql";

export const isAuth: MiddlewareFn<MyContext> = ({context}, next) => {
    const { req } = context
    if (!req.session.userId) {
        throw new Error ('Not authenticated')
    }
    return next()
}