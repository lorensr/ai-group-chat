import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { buildSubgraphSchema } from '@apollo/subgraph'
import { GraphQLResolverMap } from '@apollo/subgraph/dist/schema-helper/resolverMap'
import { gql } from 'graphql-tag'

const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  type User @key(fields: "id") {
    id: ID!
    name: String!
    online: Boolean!
  }

  type Mutation {
    reportUserActivity: User!
  }
`

const userLastSeen = new Map<string, Date>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolvers: GraphQLResolverMap<any> = {
  Mutation: {
    reportUserActivity(_, __, { userId }: { userId: string }) {
      userLastSeen.set(userId, new Date())
      return {
        id: userId,
        name: userId,
        online: true,
      }
    },
  },
  User: {
    __resolveReference({ id }: { id: string }) {
      console.log('resolve id:', id)
      let lastSeen = userLastSeen.get(id)

      // AI is always online
      if (id === 'OpenAI') {
        lastSeen = new Date()
      }

      if (!lastSeen) {
        throw new Error('User not found')
      }

      const lastSeenRecently = Date.now() - lastSeen.getTime() < 1000 * 10

      return {
        id,
        name: id,
        online: lastSeenRecently,
      }
    },
  },
}

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
})

startStandaloneServer(server, {
  context: async ({ req }) => {
    return { userId: req.headers.authorization }
  },
  listen: { port: 4001 },
}).then(({ url }) => console.log(`🚀  Server ready at ${url}`))
