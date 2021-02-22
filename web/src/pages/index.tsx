import { Box, Button, Flex, Heading, Link, Stack, Text } from '@chakra-ui/react'
import { withUrqlClient } from 'next-urql'
import NextLink from 'next/link'
import React, { useState } from 'react'
import EditDeletePostButtons from '../components/EditDeletePostButtons'
import Layout from '../components/Layout'
import UpdootSection from '../components/UpdootSection'
import { useMeQuery, usePostsQuery } from '../generated/graphql'
import { createUrlClient } from '../utils/createUrlClient'

const urlClient = withUrqlClient(createUrlClient)

const Index = () => {
  const [variables, setVariables] = useState<{ limit: number; cursor: string | null }>({ limit: 15, cursor: null })
  const [{ data, fetching }] = usePostsQuery({ variables })
  const [{ data: meData }] = useMeQuery()
  const loadMorePosts = () => {
    const posts = data.posts.posts

    setVariables({
      limit: variables.limit,
      cursor: posts[posts.length - 1].created_at
    })
  }

  return (
    <Layout variant='regular'>
      {!data || !data.posts ? (
        <div>Loading...</div>
      ) : (
        <Stack mb={8} spacing={8}>
          {data.posts.posts.map(post =>
            !post ? null : (
              <Flex p={5} shadow='md' borderWidth='1px' key={post.id}>
                <UpdootSection post={post} />
                <Box flex={1}>
                  <NextLink href='/post/[id]' as={`/post/${post.id}`}>
                    <Link>
                      <Heading fontSize='xl'>{post.title}</Heading>
                    </Link>
                  </NextLink>
                  <Text>posted by {post.creator.username}</Text>
                  <Flex align='center'>
                    <Text flex={1} mt={4}>
                      {post.textSnippet}
                    </Text>
                    <EditDeletePostButtons creatorId={post.creator.id} id={post.id} />
                  </Flex>
                </Box>
              </Flex>
            )
          )}
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
