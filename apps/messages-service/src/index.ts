import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { ApolloServer } from '@apollo/server'
import {
  expressMiddleware,
  ExpressContextFunctionArgument,
} from '@apollo/server/express4'
import { buildSubgraphSchema } from '@apollo/subgraph'
import {
  Client,
  WorkflowExecutionAlreadyStartedError,
  WorkflowNotFoundError,
} from '@temporalio/client'
import express from 'express'
import { readFileSync } from 'fs'
import { PubSub } from 'graphql-subscriptions'
import { gql } from 'graphql-tag'
import { useServer } from 'graphql-ws/lib/use/ws'
import http from 'http'
import { v4 as uuidv4 } from 'uuid'
import { WebSocketServer } from 'ws'
import { Message, Resolvers } from '@repo/common/src/generated/message-types'
import {
  getStateRpc,
  groupChat,
  joinGroupRpc,
  sendMessageRpc,
} from '@repo/durable-functions'

export interface Context {
  pubsub: PubSub
  userId: string
  temporal: Client
}

const typeDefs = gql(
  readFileSync(__dirname + '/../../../packages/common/src/messages.graphql', {
    encoding: 'utf-8',
  }),
)

const resolvers: Resolvers<Context> = {
  Query: {
    group: async (_, { id }, { temporal }) => {
      const groupFn = temporal.workflow.getHandle(id)
      try {
        return await groupFn.query(getStateRpc)
      } catch (e) {
        if (e instanceof WorkflowNotFoundError) {
          return null
        }
        throw e
      }
    },
  },
  Mutation: {
    joinOrCreateGroup: async (_, { name }, { userId, temporal }) => {
      const workflowId = name // Use the group name as the workflow ID
      const groupFn = temporal.workflow.getHandle(workflowId)

      try {
        // Attempt to start a new workflow
        await temporal.workflow.start(groupChat, {
          taskQueue: 'group-chat',
          workflowId,
          args: [userId],
        })
      } catch (e) {
        if (e instanceof WorkflowExecutionAlreadyStartedError) {
          // If the workflow already exists, signal to join the group
          await groupFn.signal(joinGroupRpc, userId)
        } else {
          throw e
        }
      }

      // Return the current state of the group
      return await groupFn.query(getStateRpc)
    },
    sendMessage: async (_, { input }, { pubsub, userId, temporal }) => {
      const message = {
        id: input.id || uuidv4(),
        content: input.content,
        sender: { id: userId },
        createdAt: input.createdAt || new Date(),
      }

      const groupFn = temporal.workflow.getHandle(input.groupId)

      const isHuman = userId !== 'OpenAI'
      if (isHuman) {
        try {
          await groupFn.signal(sendMessageRpc, message)
        } catch (e) {
          if (e instanceof WorkflowNotFoundError) {
            throw new Error('Group not found')
          }
          throw e
        }
      }

      pubsub.publish(input.groupId, message)

      return message
    },
  },
  Subscription: {
    messageSent: {
      subscribe: (_, { groupId }, { pubsub }) => {
        const iterator = pubsub.asyncIterator(groupId)
        return {
          [Symbol.asyncIterator]: () => iterator,
        }
      },
      resolve: (message: Message) => message,
    },
  },
  Group: {
    name: (group) => group.id,
  },
}

const schema = buildSubgraphSchema([{ typeDefs, resolvers }])

async function startServer() {
  const app = express()
  const httpServer = http.createServer(app)

  const server = new ApolloServer<Context>({
    schema,
  })

  await server.start()

  const pubsub = new PubSub()

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async ({
        req,
      }: ExpressContextFunctionArgument): Promise<Context> => {
        return {
          pubsub,
          userId: req.headers.authorization || 'no-auth-header-supplied',
          temporal: new Client(),
        }
      },
    }),
  )

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  })

  useServer(
    {
      schema,
      context: () => ({ pubsub }),
    },
    wsServer,
  )

  const PORT = 4002

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`)
  })
}

startServer()
