import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import dotenv from "dotenv";
import { gql } from "graphql-tag";

dotenv.config({ path: "../../../.env" });

const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  type User @key(fields: "id") {
    id: ID!
    name: String!
    online: Boolean!
  }

  type Query {
    users: [User!]!
  }
`;

const users = [
  { id: "1", name: "Alicee", online: true },
  { id: "2", name: "Bob", online: false },
];

const resolvers = {
  User: {
    __resolveReference(user: { id: string }) {
      return users.find((u) => u.id === user.id);
    },
  },
  Query: {
    users: () => users,
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, { listen: { port: 4001 } }).then(({ url }) =>
  console.log(`🚀  Server ready at ${url}`)
);
