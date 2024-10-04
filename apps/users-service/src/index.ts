import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { gql } from "graphql-tag";

const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  type User @key(fields: "id") {
    id: ID!
    name: String!
    online: Boolean!
  }

  type Mutation {
    reportUserActivity(userId: ID!): User!
  }
`;

const userLastSeen = new Map<string, Date>();

const resolvers = {
  Mutation: {
    reportUserActivity(userId: string) {
      userLastSeen.set(userId, new Date());
      return {
        id: userId,
      };
    },
  },
  User: {
    __resolveReference({ id }: { id: string }) {
      const lastSeen = userLastSeen.get(id);
      if (!lastSeen) {
        throw new Error("User not found");
      }

      const lastSeenLessThanOneMinuteAgo =
        Date.now() - lastSeen.getTime() < 1000 * 60;

      return {
        id,
        name: id,
        online: lastSeenLessThanOneMinuteAgo,
      };
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, { listen: { port: 4001 } }).then(({ url }) =>
  console.log(`🚀  Server ready at ${url}`)
);
