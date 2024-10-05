'use client'

import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  split,
  HttpLink,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { useState } from 'react'
import { GroupChat } from '../components/group-chat'
import { ChatEntryForm } from '../components/chat-entry-form'
import styles from './page.module.css'

export default function Home() {
  const [groupName, setGroupName] = useState('')
  const [userName, setUserName] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleFormSubmit = (userName: string, groupName: string) => {
    setUserName(userName)
    setGroupName(groupName)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    const httpLink = new HttpLink({
      uri: 'http://localhost:4002/graphql',
    })

    const authLink = setContext((_, { headers }) => {
      return {
        headers: {
          ...headers,
          authorization: userName ? userName : '',
        },
      }
    })

    const wsLink = new GraphQLWsLink(
      createClient({
        url: 'ws://localhost:4002/graphql',
        connectionParams: {
          headers: {
            authorization: userName ? userName : '',
          },
        },
      }),
    )

    const splitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query)
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        )
      },
      wsLink,
      authLink.concat(httpLink), // Ensure authLink is concatenated with httpLink
    )

    const client = new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache(),
    })

    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <ApolloProvider client={client}>
            <GroupChat groupName={groupName} userName={userName} />
          </ApolloProvider>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ChatEntryForm onSubmit={handleFormSubmit} />
      </main>
    </div>
  )
}
