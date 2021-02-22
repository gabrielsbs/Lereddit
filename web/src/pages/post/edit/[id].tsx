import { Box, Button } from '@chakra-ui/react'
import { Form, Formik } from 'formik'
import { withUrqlClient } from 'next-urql'
import { useRouter } from 'next/router'
import React from 'react'
import { InputField } from '../../../components/InputField'
import Layout from '../../../components/Layout'
import { useUpdatePostMutation } from '../../../generated/graphql'
import { createUrlClient } from '../../../utils/createUrlClient'
import { useGetPostFromUrl } from '../../../utils/useGetPostFromUrl'

interface EditPostProps {}
const urlClient = withUrqlClient(createUrlClient)

const EditPost = () => {
  const router = useRouter()

  const [{ data, fetching }] = useGetPostFromUrl()
  const [, updatePost] = useUpdatePostMutation()

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
    <Layout variant='small'>
      <Formik
        initialValues={{ title: post.title, text: post.text }}
        onSubmit={async (values, { setErrors }) => {
          const { error } = await updatePost({ id: post.id, ...values })
          if (!error) {
            router.back()
          }
        }}>
        {({ isSubmitting }) => (
          <Form>
            <InputField name='title' placeholder='title' label='Title' />
            <Box mt={4}>
              <InputField name='text' placeholder='Text...' label='Body' textArea />
            </Box>
            <Button mt={4} type='submit' isLoading={isSubmitting} colorScheme='teal'>
              Edit Post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  )
}

export default urlClient(EditPost)
