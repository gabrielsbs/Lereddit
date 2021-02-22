import { DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { Box, IconButton, Link } from '@chakra-ui/react'
import NextLink from 'next/link'
import React from 'react'
import { useDeletePostMutation, useMeQuery } from '../generated/graphql'

interface EditDeletePostButtonsProps {
  id: number
  creatorId: number
}

const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({ id, creatorId }) => {
  const [, deletePostMutation] = useDeletePostMutation()
  const [{ data }] = useMeQuery()
  if (data?.me?.id !== creatorId) {
    return null
  }
  return (
    <Box ml='auto'>
      <NextLink href='/post/edit/[id]' as={`/post/edit/${id}`}>
        <IconButton mr={2} as={Link} aria-label='edit post' icon={<EditIcon />} />
      </NextLink>
      <IconButton onClick={() => deletePostMutation({ id })} aria-label='delete post' icon={<DeleteIcon />} />
    </Box>
  )
}

export default EditDeletePostButtons
