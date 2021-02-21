import { withUrqlClient } from 'next-urql'
import { useRouter } from 'next/router'
import React from 'react'
import Layout from '../../components/Layout'
import { usePostQuery } from '../../generated/graphql'
import { createUrlClient } from '../../utils/createUrlClient'

const urlClient = withUrqlClient(createUrlClient)

const Post = () => {
  const router = useRouter()
  const postId = typeof router.query.id === 'string' ? Number.parseInt(router.query.id) : -1
  const [{ data, fetching }] = usePostQuery({
    pause: postId === -1,
    variables: {
      postId
    }
  })

  if (fetching || !data) {
    return <Layout>Loading...</Layout>
  }

  return <Layout>{data.post.text}</Layout>
}

export default urlClient(Post)
