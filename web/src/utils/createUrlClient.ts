import { gql } from '@urql/core'
import { cacheExchange, Resolver } from '@urql/exchange-graphcache'
import { SSRExchange } from 'next-urql'
import Router from 'next/router'
import { dedupExchange, Exchange, fetchExchange, stringifyVariables } from 'urql'
import { pipe, tap } from 'wonka'
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
  VoteMutationVariables
} from '../generated/graphql'
import { betterUpdateQuery } from './betterUpdateQuery'

const errorExchange: Exchange = ({ forward }) => ops$ => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      if (error) {
        if (error.message.includes('Not authenticated')) {
          Router.replace('/login?next')
        }
      }
    })
  )
}

export const createUrlClient = (ssrExchange: SSRExchange) => ({
  url: 'http://localhost:4000/graphql',
  fetchOptions: {
    credentials: 'include' as const
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      keys: {
        PaginatedPost: () => null
      },
      resolvers: {
        Query: {
          posts: cursorPagination()
        }
      },
      updates: {
        Mutation: {
          vote: (_result, args, cache, info) => {
            const { postId, value } = args as VoteMutationVariables
            const data = cache.readFragment(
              gql`
                fragment _ on Post {
                  id
                  points
                  voteStatus
                }
              `,
              { id: postId }
            )
            if (data) {
              if (data.voteStatus === value) {
                return
              }
              const newPoints = (data.points as number) + value * (data.voteStatus ? 2 : 1)
              cache.writeFragment(
                gql`
                  fragment __ on Post {
                    points
                    voteStatus
                  }
                `,
                { id: postId, points: newPoints, voteStatus: value }
              )
            }
          },
          createPost: (_result, args, cache, info) => {
            const allFields = cache.inspectFields('Query')
            const fieldInfos = allFields.filter(info => info.fieldName === 'posts')
            fieldInfos.forEach(fi => {
              cache.invalidate('Query', 'posts', fi.arguments)
            })
          },
          logout: (_result, args, cache, info) => {
            betterUpdateQuery<LogoutMutation, MeQuery>(cache, { query: MeDocument }, _result, () => ({ me: null }))
          },
          login: (_result, args, cache, info) => {
            betterUpdateQuery<LoginMutation, MeQuery>(cache, { query: MeDocument }, _result, (result, query) => {
              if (result.login.errors) {
                return query
              }
              return {
                me: result.login.user
              }
            })
          },
          register: (_result, args, cache, info) => {
            betterUpdateQuery<RegisterMutation, MeQuery>(cache, { query: MeDocument }, _result, (result, query) => {
              if (result.register.errors) {
                return query
              }
              return {
                me: result.register.user
              }
            })
          }
        }
      }
    }),
    errorExchange,
    ssrExchange,
    fetchExchange
  ]
})

export type MergeMode = 'before' | 'after'

export interface PaginationParams {
  cursoArgument?: string
}

export const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info

    const allFields = cache.inspectFields(entityKey)
    const fieldInfos = allFields.filter(info => info.fieldName === fieldName)
    const size = fieldInfos.length
    if (size === 0) {
      return undefined
    }

    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`
    const isInTheCache = cache.resolve(cache.resolve(entityKey, fieldKey) as string, 'posts')
    info.partial = !isInTheCache
    let hasMore = true
    const results: string[] = []
    fieldInfos.forEach(fi => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string
      const data = cache.resolve(key, 'posts') as string[]
      hasMore = (cache.resolve(key, 'hasMore') as boolean) && hasMore
      results.push(...data)
    })

    return {
      __typename: 'PaginatedPost',
      hasMore,
      posts: results
    }
  }
}
