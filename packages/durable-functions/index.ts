import type * as activities from '@repo/activities'
import { Group, Message, User } from '@repo/common/src/generated/message-types'
import {
  ApplicationFailure,
  condition,
  defineQuery,
  defineSignal,
  proxyActivities,
  setHandler,
  sleep,
  uuid4,
  workflowInfo,
} from '@temporalio/workflow'

export const getStateRpc = defineQuery<Group>('getState')
export const sendMessageRpc = defineSignal<[Message]>('sendMessage')
export const joinGroupRpc = defineSignal<[string]>('joinGroup')

const { getAiResponse, publishMessage } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1m',
})

export async function groupChat(userId: string): Promise<void> {
  const user = { id: userId }

  const group: Group = {
    id: workflowInfo().workflowId,
    name: workflowInfo().workflowId,
    members: [user],
    messages: [],
  }

  function addUserToGroup(userId?: string): void {
    const userExists = group.members.some(
      (member) => member !== null && member.id === userId,
    )
    if (userId && !userExists) {
      group.members.push({ id: userId })
    }
  }

  let messagesSentToAi = 0

  setHandler(getStateRpc, () => group)

  setHandler(sendMessageRpc, (message) => {
    group.messages.push(message)
    addUserToGroup(message.sender?.id)
  })

  setHandler(joinGroupRpc, (newUserId) => {
    addUserToGroup(newUserId)
  })

  while (true) {
    await condition(() => group.messages.length > messagesSentToAi)
    messagesSentToAi = group.messages.length

    // unless it's the first message, wait for 10 seconds to allow others to send messages
    if (group.messages.length !== 1) {
      await sleep('10s')
    }

    const response = await getAiResponse(group.messages)
    const aiMessage = {
      content: response,
      sender: {
        id: 'OpenAI',
      },
      createdAt: new Date(),
      id: uuid4(),
    }

    group.messages.push(aiMessage)
    messagesSentToAi++ // skip over the AI message
    await publishMessage(aiMessage)
  }
}
