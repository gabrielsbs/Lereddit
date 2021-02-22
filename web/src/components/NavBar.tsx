import { Box, Button, Flex, Heading, Link } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import { useLogoutMutation, useMeQuery } from '../generated/graphql'

export interface NavBarProps {}

const NavBar: React.FC<NavBarProps> = () => {
  const router = useRouter()
  const [{ data, fetching }] = useMeQuery()
  const [, logout] = useLogoutMutation()

  const onClickLogout = async () => {
    await logout()
    router.reload()
  }

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
      <Flex align='center'>
        <NextLink href='/create-post'>
          <Button as={Link} mr={6}>
            Create post
          </Button>
        </NextLink>
        <Box mr={2}>{data.me.username}</Box>
        <Button onClick={onClickLogout} variant='link'>
          logout
        </Button>
      </Flex>
    )
  }
  return (
    <Flex zIndex={2} bg='tan' position='sticky' top={0} p={4}>
      <Flex maxW={800} m='auto' align='center' flex={1}>
        <NextLink href='/'>
          <Link>
            <Heading>LeReddit</Heading>
          </Link>
        </NextLink>
        <Box ml={'auto'}>{body}</Box>
      </Flex>
    </Flex>
  )
}

export default NavBar
