AI group chat with: 

- a GraphQL federated subscription for getting messages to the client
- a durable function for easily maintaining chat state and reliably coordinating with OpenAI

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Contents**

- [Code structure](#code-structure)
  - [Apps](#apps)
  - [Packages](#packages)
  - [Code of note](#code-of-note)
- [Set up](#set-up)
- [Run](#run)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Code structure

Turborepo monorepo. 

### Apps

- `apps/web` - Next.js client
- `apps/router` - Apollo router
- `apps/users-service` - subgraph that resolves the User entity
- `apps/messages-service` - subgraph that handles Subscriptions and proxies Queries and Mutations to the durable function
- `apps/worker` - runs the durable functions

### Packages

- `packages/common` - types generated from messages schema and supergraph schema
- `packages/durable-functions` - the `groupChat` durable function
- `packages/activities` - normal functions called by the durable function
- `packages/ui` - UI components
- `packages/eslint-config`
- `packages/typescript-config`

### Code of note

- [apps/web/components/group-chat.tsx](apps/web/components/group-chat.tsx) - Client query, mutation, and subscription
- [apps/users-service/src/index.ts](apps/users-service/src/index.ts) - Small users subgraph, keeps name and online status
- [apps/messages-service/src/index.ts](apps/messages-service/src/index.ts) - Messages subgraph, talks to `groupChat` durable function
- [packages/common/src/messages.graphql](packages/common/src/messages.graphql) - Messages schema
- [packages/durable-functions/index.ts](packages/durable-functions/index.ts) - `groupChat` durable function
- [packages/activities/index.ts](packages/activities/index.ts) - AI SDK code that talks to OpenAI

## Set up

```sh
brew install temporal
curl -sSL https://rover.apollo.dev/nix/latest | sh
git clone https://github.com/lorensr/ai-group-chat.git
cd ai-group-chat
npm i
```

Create a `.env` file at the project root with these values filled in:

```sh
APOLLO_KEY=
APOLLO_GRAPH_REF=
OPENAI_API_KEY=
```

The Apollo info must be from a free trial Enterprise account (until Apollo [releases](https://www.apollographql.com/blog/federated-subscriptions-in-graphos-real-time-data-at-scale#federated-subscriptions-with-graphos-cloud) federated subscriptions to GraphOS Cloud).

## Run

```sh
temporal server start-dev
```

```sh
npm run dev
```