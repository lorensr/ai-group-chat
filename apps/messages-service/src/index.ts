import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { buildSubgraphSchema } from "@apollo/subgraph";
import dotenv from "dotenv";
import express from "express";
import { readFileSync } from "fs";
import { PubSub } from "graphql-subscriptions";
import { gql } from "graphql-tag";
import { useServer } from "graphql-ws/lib/use/ws";
import http from "http";
import { WebSocketServer } from "ws";
import { Message, Resolvers } from "./generated/graphql";

export interface Context {
  pubsub: PubSub;
  userId: string;
}

dotenv.config({ path: "../../../.env" });

const typeDefs = gql(
  readFileSync(__dirname + "/messages.graphql", { encoding: "utf-8" })
);

const groups = [
  {
    id: "1",
    name: "Chat Group",
    members: [{ id: "alice" }],
    messages: [
      { content: "hi", createdAt: new Date(), id: "1", sender: { id: "1" } },
    ],
  },
];

let messageId = 1;

const resolvers: Resolvers<Context> = {
  Query: {
    group: async (_, { id }) => {
      const group = groups.find((group) => group.id === id);
      return group || null;
    },
  },
  Mutation: {
    sendMessage: async (_, { groupId, content }, { pubsub, userId }) => {
      const group = groups.find((group) => group.id === groupId);
      if (!group) {
        throw new Error("Group not found");
      }

      const newMessage = {
        id: String(messageId++),
        content,
        sender: { id: userId },
        createdAt: new Date(),
      };

      // group.messages.push(newMessage);

      pubsub.publish(groupId, newMessage);

      return newMessage;
    },
  },
  Subscription: {
    messageSent: {
      subscribe: (_, { groupId }, { pubsub }) => {
        const iterator = pubsub.asyncIterator(groupId);
        return {
          [Symbol.asyncIterator]: () => iterator,
        };
      },
      resolve: (message: Message) => message,
    },
  },
};

const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer<Context>({
    schema,
  });

  await server.start();

  const pubsub = new PubSub();

  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => {
        return { pubsub, userId: req.headers.authorization || "" };
      },
    })
  );

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  useServer(
    {
      schema,
      context: () => ({ pubsub }),
    },
    wsServer
  );

  const PORT = 4002;

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`);
  });
}

startServer();
