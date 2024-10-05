'use client'

import {
  ApolloClient,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  gql,
  split,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { useState } from 'react'
import { ChatEntryForm } from '../components/chat-entry-form'
import { REPORT_USER_ACTIVITY } from '../components/graphql/mutations'
import { GroupChat } from '../components/group-chat'
import styles from './page.module.css'

const JOIN_OR_CREATE_GROUP = gql`
  mutation JoinOrCreateGroup($name: String!) {
    joinOrCreateGroup(name: $name) {
      id
      name
      members {
        id
        name
        online
      }
      messages {
        id
        content
        createdAt
        sender {
          id
          name
        }
      }
    }
  }
`

export default function Home() {
  const [groupName, setGroupName] = useState('')
  const [userName, setUserName] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [client, setClient] = useState<ApolloClient<any> | null>(null)

  const handleFormSubmit = async (userName: string, groupName: string) => {
    setUserName(userName)
    setGroupName(groupName)

    const httpLink = new HttpLink({
      uri: 'http://localhost:4000/',
    })

    const authLink = setContext((_, { headers }) => ({
      headers: {
        ...headers,
        authorization: userName,
      },
    }))

    const client = new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
    })

    try {
      let result = await client.mutate({
        mutation: REPORT_USER_ACTIVITY,
      })
      console.log('result:', result)

      await client.mutate({
        mutation: JOIN_OR_CREATE_GROUP,
        variables: { name: groupName },
      })
      console.log('result:', result)

      setClient(client)
      setIsSubmitted(true)
    } catch (error) {
      console.error(
        'Error during user activity reporting or group joining:',
        error,
      )
    }
  }

  if (isSubmitted && client) {
    return (
      // <div className={styles.page}>
      //   <main className={styles.main}>
      <ApolloProvider client={client}>
        <GroupChat groupName={groupName} userName={userName} />
      </ApolloProvider>
      //   </main>
      // </div>
    )
  }

  // Before submission or client initialization
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {!isSubmitted ? (
          <ChatEntryForm onSubmit={handleFormSubmit} />
        ) : (
          <p>Loading...</p>
        )}
      </main>
    </div>
  )
}
