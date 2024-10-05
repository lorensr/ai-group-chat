'use client'

import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  split,
  HttpLink,
} from '@apollo/client'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { useState } from 'react'
import { GroupChat } from '../components/group-chat'
import styles from './page.module.css'

const httpLink = new HttpLink({
  uri: 'http://localhost:4002/graphql',
})

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4002/graphql',
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
  httpLink,
)

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})

export default function Home() {
  const [groupName, setGroupName] = useState('')
  const [userName, setUserName] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (groupName && userName) {
      setIsSubmitted(true)
    }
  }

  if (isSubmitted) {
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
        <form onSubmit={handleSubmit}>
          <label>
            Group Name:
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </label>
          <br />
          <label>
            User Name:
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </label>
          <br />
          <button type="submit">Join Chat</button>
        </form>
      </main>
    </div>
  )
}
