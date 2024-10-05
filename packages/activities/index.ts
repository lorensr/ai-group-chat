import { Message } from '@repo/common/src/generated/message-types'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { Context } from '@temporalio/activity'

export async function getAiResponse(messages: Message[]): Promise<string> {
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system:
      'You are a helpful AI in a group chat. ' +
      'You write simple, clear, and concise content.',
    messages: messages.map((message) => ({
      role: message.sender?.id === 'OpenAI' ? 'assistant' : 'user',
      content: message.content,
    })),
  })
  return text
}

export async function publishMessage(message: Message): Promise<void> {
  await fetch('http://localhost:4002/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'OpenAI' },
    body: JSON.stringify({
      query: `
        mutation SendMessage($input: MessageInput!) {
          sendMessage(input: $input) {
            id
          }
        }
      `,
      variables: {
        input: {
          groupId: Context.current().info.workflowExecution.workflowId,
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
        },
      },
    }),
  })
}
