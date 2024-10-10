'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { gql, useMutation, useQuery, useSubscription } from '@apollo/client'
import {
  Group,
  Message,
  MutationSendMessageArgs,
  QueryGroupArgs,
  SubscriptionMessageSentArgs,
} from '@repo/common'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { REPORT_USER_ACTIVITY } from './graphql/mutations'
import UserAvatar from './user-avatar'

const GET_GROUP = gql`
  query GetGroup($id: ID!) {
    group(id: $id) {
      id
      name
      members {
        id
        name
        online
      }
      messages {
        id
        content
        createdAt
        sender {
          id
          name
        }
      }
    }
  }
`

const SEND_MESSAGE = gql`
  mutation SendMessage($input: MessageInput!) {
    sendMessage(input: $input) {
      id
      content
      createdAt
      sender {
        id
        name
      }
    }
  }
`

const MESSAGE_SENT = gql`
  subscription MessageSent($groupId: ID!) {
    messageSent(groupId: $groupId) {
      id
      content
      createdAt
      sender {
        id
        name
      }
    }
  }
`

export function GroupChat({
  groupName,
  userName,
}: {
  groupName: string
  userName: string
}) {
  const [newMessage, setNewMessage] = useState('')
  const [showScrollDown, setShowScrollDown] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)

  const [reportUserActivity] = useMutation(REPORT_USER_ACTIVITY)
  const [sendMessage] = useMutation<
    { sendMessage: Message },
    MutationSendMessageArgs
  >(SEND_MESSAGE)

  const { data, loading, error } = useQuery<{ group: Group }, QueryGroupArgs>(
    GET_GROUP,
    {
      variables: { id: groupName },
      pollInterval: 5000,
    },
  )

  // Subscribe to new messages
  useSubscription<{ messageSent: Message }, SubscriptionMessageSentArgs>(
    MESSAGE_SENT,
    {
      variables: { groupId: groupName },
      onData: ({ client, data }) => {
        const newMessage = data.data?.messageSent
        if (!newMessage) return

        client.cache.updateQuery<{ group: Group }, QueryGroupArgs>(
          { query: GET_GROUP, variables: { id: groupName } },
          (existingData) => {
            if (!existingData?.group) return existingData

            return {
              group: {
                ...existingData.group,
                messages: [...existingData.group.messages, newMessage],
              },
            }
          },
        )
      },
    },
  )

  useEffect(() => {
    // Report activity immediately on component mount
    reportUserActivity({ variables: { userId: userName } })

    const interval = setInterval(() => {
      reportUserActivity({ variables: { userId: userName } })
    }, 5 * 1000)

    // Clean up the interval on component unmount
    return () => clearInterval(interval)
  }, [reportUserActivity, userName])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      await sendMessage({
        variables: {
          input: {
            groupId: groupName,
            content: newMessage,
          },
        },
        // rely on subscription to update cache
        // update: (cache, { data }) => {
        //   const existingData = cache.readQuery<
        //     {
        //       group: Group
        //     },
        //     QueryGroupArgs
        //   >({
        //     query: GET_GROUP,
        //     variables: { id: groupName },
        //   })

        //   if (existingData && data?.sendMessage) {
        //     cache.writeQuery({
        //       query: GET_GROUP,
        //       variables: { id: groupName },
        //       data: {
        //         group: {
        //           ...existingData.group,
        //           messages: [...existingData.group.messages, data.sendMessage],
        //         },
        //       },
        //     })
        //   }
        // },
      })

      setNewMessage('')
    }
  }

  const scrollToBottom = () => {
    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const checkScrollPosition = () => {
      if (scrollAreaRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
        setShowScrollDown(scrollHeight - scrollTop - clientHeight > 20)
      }
    }

    const scrollArea = scrollAreaRef.current
    if (scrollArea) {
      scrollArea.addEventListener('scroll', checkScrollPosition)
      checkScrollPosition() // Initial check
    }

    return () => {
      if (scrollArea) {
        scrollArea.removeEventListener('scroll', checkScrollPosition)
      }
    }
  }, [data?.group?.messages])

  useEffect(() => {
    scrollToBottom()
  }, [data?.group?.messages])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>
  if (!data || !data.group) return <p>Group not found.</p>

  return (
    <div className="flex h-screen max-w-7xl mx-auto bg-background">
      {/* User list sidebar */}
      <div className="w-42 border-x border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Group Members</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="p-4 space-y-4">
            {data.group.members
              .concat({
                id: 'OpenAI',
                name: 'OpenAI',
                online: true,
              })
              .map((user) => {
                const isCurrentUser = user?.name === userName

                return (
                  <div
                    key={user?.id}
                    className={`flex items-center space-x-3 p-2 rounded ${
                      isCurrentUser ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="relative">
                      <UserAvatar name={user?.name} />
                      {user?.online && (
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background"></span>
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${isCurrentUser ? 'font-bold text-blue-700' : 'text-gray-900'}`}
                      >
                        {user?.name}
                      </p>
                    </div>
                  </div>
                )
              })}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col border-r border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Group Chat</h2>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="p-4 space-y-6">
              {data.group.messages.map((message, index) => {
                const user =
                  data.group.members.find(
                    (u) => u?.id === message.sender?.id,
                  ) ||
                  (message.sender?.name === 'OpenAI'
                    ? { name: 'OpenAI' }
                    : null)

                return (
                  <div
                    key={message.id}
                    className="flex items-start space-x-3"
                    ref={
                      index === data.group.messages.length - 1
                        ? lastMessageRef
                        : null
                    }
                  >
                    <UserAvatar name={user?.name} />
                    <div>
                      <p className="text-sm font-medium">
                        {user?.name}{' '}
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </p>
                      <div className="text-sm mt-1 markdown-content">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className="mb-2">{children}</p>
                            ),
                            strong: ({ children }) => (
                              <span className="font-bold">{children}</span>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-5 mb-2">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-5 mb-2">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="mb-1">{children}</li>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
          {showScrollDown && (
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-20 right-4 rounded-full shadow-md"
              onClick={scrollToBottom}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
          <div className="p-4 border-t border-border bg-background">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
