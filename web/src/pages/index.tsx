import { Box, Button, Flex, Heading, Link, Stack, Text } from '@chakra-ui/react'
import { withUrqlClient } from 'next-urql'
import NextLink from 'next/link'
import React, { useState } from 'react'
import Layout from '../components/Layout'
import UpdootSection from '../components/UpdootSection'
import { usePostsQuery } from '../generated/graphql'
import { createUrlClient } from '../utils/createUrlClient'

const urlClient = withUrqlClient(createUrlClient)

const Index = () => {
  const [variables, setVariables] = useState<{ limit: number; cursor: string | null }>({ limit: 15, cursor: null })
  const [{ data, fetching }] = usePostsQuery({ variables })
  const loadMorePosts = () => {
    const posts = data.posts.posts

    setVariables({
      limit: variables.limit,
      cursor: posts[posts.length - 1].created_at
    })
  }

  return (
    <Layout variant='regular'>
      <Flex align='center' mb={4}>
        <Heading>LeReddit</Heading>
        <NextLink href='/create-post'>
          <Link ml='auto'>Create post</Link>
        </NextLink>
      </Flex>

      {!data || !data.posts ? (
        <div>Loading...</div>
      ) : (
        <Stack mb={8} spacing={8}>
          {data.posts.posts.map(post => (
            <Flex p={5} shadow='md' borderWidth='1px' key={post.id}>
              <UpdootSection post={post} />
              <Box>
                <Heading fontSize='xl'>{post.title}</Heading>
                <Text>posted by {post.creator.username}</Text>
                <Text mt={4}>{post.textSnippet}</Text>
              </Box>
            </Flex>
          ))}
        </Stack>
      )}
      {!!data && data.posts.hasMore && (
        <Flex justify='center' mb={4}>
          <Button onClick={loadMorePosts}>Load more</Button>
        </Flex>
      )}
    </Layout>
  )
}

export default urlClient(Index)
