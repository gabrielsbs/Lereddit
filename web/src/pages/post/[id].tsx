import { Box, Heading } from '@chakra-ui/react'
import { withUrqlClient } from 'next-urql'
import React from 'react'
import EditDeletePostButtons from '../../components/EditDeletePostButtons'
import Layout from '../../components/Layout'
import { createUrlClient } from '../../utils/createUrlClient'
import { useGetPostFromUrl } from '../../utils/useGetPostFromUrl'

const urlClient = withUrqlClient(createUrlClient)

const Post = () => {
  const [{ data, fetching }] = useGetPostFromUrl()

  if (fetching || !data) {
    return <Layout>Loading...</Layout>
  }

  if (!data?.post) {
    return (
      <Layout>
        <Box>Could not find post</Box>{' '}
      </Layout>
    )
  }
  const { post } = data

  return (
    <Layout>
      <Heading>{post.title}</Heading>
      <Box mt={2} mb={4}>
        {post.text}
      </Box>
      <EditDeletePostButtons creatorId={post.creator.id} id={post.id} />
    </Layout>
  )
}

export default urlClient(Post)
