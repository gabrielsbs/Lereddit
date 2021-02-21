import { Box, Button, Flex, Link } from '@chakra-ui/react'
import NextLink from 'next/link'
import React from 'react'
import { useLogoutMutation, useMeQuery } from '../generated/graphql'

export interface NavBarProps {}

const NavBar: React.FC<NavBarProps> = () => {
  const [{ data, fetching }] = useMeQuery()
  const [, logout] = useLogoutMutation()
  let body = null
  if (fetching) {
  } else if (!data || !data.me) {
    body = (
      <>
        <NextLink href='/login'>
          <Link color='white' mr={2}>
            Login
          </Link>
        </NextLink>
        <NextLink href='/register'>
          <Link color='white'>Register</Link>
        </NextLink>
      </>
    )
  } else {
    body = (
      <Flex>
        <Box mr={2}>{data.me.username}</Box>
        <Button onClick={() => logout()} variant='link'>
          logout
        </Button>
      </Flex>
    )
  }
  return (
    <Flex zIndex={2} bg='tan' position='sticky' top={0} p={4}>
      <Box ml={'auto'}>{body}</Box>
    </Flex>
  )
}

export default NavBar
