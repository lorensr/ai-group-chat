import type * as activities from "@repo/activities";
import { Group, Message } from "@repo/common";
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
} from "@temporalio/workflow";

export const getState = defineQuery<Group>("getState");
export const sendMessage = defineSignal<[Message]>("sendMessage");

const { getAiResponse, publishMessage } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1m",
});

export async function groupChat(userId: string): Promise<void> {
  const user = {
    id: userId,
  };

  const group: Group = {
    id: workflowInfo().workflowId,
    name: workflowInfo().workflowId,
    members: [user],
    messages: [],
  };

  let messagesSentToAi = 0;

  setHandler(getState, () => group);

  setHandler(sendMessage, (message) => {
    group.messages.push(message);

    const isNewUser = !group.members.some(
      (member) => member !== null && member.id === message.sender?.id
    );
    if (isNewUser && message.sender) {
      group.members.push(message.sender);
    }
  });

  while (true) {
    await condition(() => group.messages.length > messagesSentToAi);
    messagesSentToAi = group.messages.length;

    // unless it's the first message, wait for 10 seconds to allow others to send messages
    if (group.messages.length !== 1) {
      await sleep("10s");
    }

    const response = await getAiResponse(group.messages);
    const aiMessage = {
      content: response,
      sender: {
        id: "OpenAI",
      },
      createdAt: new Date(),
      id: uuid4(),
    };

    group.messages.push(aiMessage);
    messagesSentToAi++; // skip over the AI message
    await publishMessage(aiMessage);
  }
}
