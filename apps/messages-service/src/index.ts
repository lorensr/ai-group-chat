import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import dotenv from "dotenv";
import { gql } from "graphql-tag";

dotenv.config({ path: "../../../.env" });

const typeDefs = gql`
  type Query {
    group(id: ID!): Group
  }

  type Mutation {
    sendMessage(groupId: ID!, content: String!): Message!
  }

  type Subscription {
    messageSent(groupId: ID!): Message!
  }

  type Group {
    id: ID!
    name: String!
    members: [User]!
    messages: [Message!]!
  }

  type Message {
    id: ID!
    content: String!
    sender: User
    createdAt: DateTime!
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

startStandaloneServer(server, { listen: { port: 4002 } }).then(({ url }) =>
  console.log(`🚀  Server ready at ${url}`)
);
