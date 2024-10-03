import { ApolloServer } from "@apollo/server";
import {
  expressMiddleware,
  ExpressContextFunctionArgument,
} from "@apollo/server/express4";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { Client, WorkflowNotFoundError } from "@temporalio/client";
import dotenv from "dotenv";
import express from "express";
import { readFileSync } from "fs";
import { PubSub } from "graphql-subscriptions";
import { gql } from "graphql-tag";
import { useServer } from "graphql-ws/lib/use/ws";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import { WebSocketServer } from "ws";
import { Message, Resolvers } from "@repo/common";
import { getState } from "@repo/durable-functions";

export interface Context {
  pubsub: PubSub;
  userId: string;
  temporal: Client;
}

dotenv.config({ path: "../../../.env" });

const typeDefs = gql(
  readFileSync(__dirname + "/../../common/src/messages.graphql", {
    encoding: "utf-8",
  })
);

const resolvers: Resolvers<Context> = {
  Query: {
    group: async (_, { id }, { temporal }) => {
      const groupFn = temporal.workflow.getHandle(id);
      try {
        return await groupFn.query(getState);
      } catch (e) {
        if (e instanceof WorkflowNotFoundError) {
          return null;
        }
        throw e;
      }
    },
  },
  Mutation: {
    createGroup: async (_, { name }, { userId, temporal }) => {
      await temporal.workflow.start(groupChat, {
        taskQueue: "group-chat",
        workflowId: name,
        args: [userId],
      });
      return { id: name, name, members: [{ id: userId }], messages: [] };
    },
    sendMessage: async (
      _,
      { groupId, content },
      { pubsub, userId, temporal }
    ) => {
      const message = {
        id: uuidv4(),
        content,
        sender: { id: userId },
        createdAt: new Date(),
      };

      const groupFn = temporal.workflow.getHandle(groupId);
      try {
        await groupFn.signal("sendMessage", message);
      } catch (e) {
        if (e instanceof WorkflowNotFoundError) {
          throw new Error("Group not found");
        }
        throw e;
      }

      pubsub.publish(groupId, message);

      return message;
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
  Group: {
    name: (group) => group.id,
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
      context: async ({
        req,
      }: ExpressContextFunctionArgument): Promise<Context> => {
        return {
          pubsub,
          userId: req.headers.authorization || "",
          temporal: new Client(),
        };
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
