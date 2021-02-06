import { withUrqlClient } from 'next-urql'
import NavBar from '../components/NavBar'
import { usePostsQuery } from '../generated/graphql'
import { createUrlClient } from '../utils/createUrlClient'

const urlClient = withUrqlClient(createUrlClient, { ssr: true })

const Index = () => {
  const [{ data }] = usePostsQuery()
  return (
    <>
      <NavBar />
      <div>Hello World</div>
      {!data ? null : data.posts.map(post => <div key={post.id}>{post.title}</div>)}
    </>
  )
}

export default urlClient(Index)
