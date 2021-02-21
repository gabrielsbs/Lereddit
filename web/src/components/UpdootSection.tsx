import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { Flex, IconButton, Text } from '@chakra-ui/react'
import React from 'react'
import { PostSnippetFragment, useVoteMutation } from '../generated/graphql'

interface UpdootSectionProps {
  post: PostSnippetFragment
}

const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
  const [, vote] = useVoteMutation()
  const onClick = (value: number, enable: boolean) => {
    if (enable) {
      vote({
        postId: post.id,
        value
      })
    }
  }
  return (
    <Flex direction='column' justifyContent='center' alignItems='center' mr={4}>
      <IconButton
        onClick={() => onClick(1, post.voteStatus !== 1)}
        colorScheme={post.voteStatus === 1 ? 'green' : undefined}
        aria-label='up vote'
        icon={<ChevronUpIcon size='24px' />}
      />
      <Text my={1}>{post.points}</Text>
      <IconButton
        onClick={() => onClick(-1, post.voteStatus !== -1)}
        colorScheme={post.voteStatus === -1 ? 'red' : undefined}
        aria-label='down vote'
        icon={<ChevronDownIcon size='36px' />}
      />
    </Flex>
  )
}

export default UpdootSection
