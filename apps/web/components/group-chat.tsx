'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronDown } from 'lucide-react'

const users = [
  {
    id: 1,
    name: 'Alice',
    status: 'online',
    avatar: '/placeholder.svg?height=40&width=40',
  },
  {
    id: 2,
    name: 'Bob',
    status: 'offline',
    avatar: '/placeholder.svg?height=40&width=40',
  },
  {
    id: 3,
    name: 'Charlie',
    status: 'online',
    avatar: '/placeholder.svg?height=40&width=40',
  },
  {
    id: 4,
    name: 'David',
    status: 'online',
    avatar: '/placeholder.svg?height=40&width=40',
  },
  {
    id: 5,
    name: 'Eve',
    status: 'offline',
    avatar: '/placeholder.svg?height=40&width=40',
  },
]

const initialMessages = [
  { id: 1, userId: 1, text: 'Hey everyone!', timestamp: '10:00:15 AM' },
  {
    id: 2,
    userId: 3,
    text: 'Hi Alice! How are you?',
    timestamp: '10:02:30 AM',
  },
  {
    id: 3,
    userId: 1,
    text: "I'm doing great, thanks for asking!",
    timestamp: '10:03:45 AM',
  },
  {
    id: 4,
    userId: 4,
    text: "Hello all, what's the topic for today?",
    timestamp: '10:05:20 AM',
  },
  {
    id: 5,
    userId: 2,
    text: "I've been working on a new project that I'm really excited about. It's a machine learning algorithm that can predict weather patterns with unprecedented accuracy. The model takes into account not just traditional meteorological data, but also factors like solar activity, ocean currents, and even butterfly migrations! I know it sounds a bit out there, but the preliminary results are incredibly promising. I'd love to share more details and get your thoughts on potential applications.",
    timestamp: '10:10:05 AM',
  },
  {
    id: 6,
    userId: 5,
    text: "Wow, Bob! That sounds fascinating. I've always been interested in the intersection of AI and environmental science. Have you considered how this could be applied to climate change research? I imagine that with such a comprehensive model, we might be able to make more accurate predictions about long-term climate trends and potentially identify more effective mitigation strategies. Also, I'm curious about the data sources you're using. How do you ensure the quality and reliability of such diverse inputs?",
    timestamp: '10:15:30 AM',
  },
  {
    id: 7,
    userId: 1,
    text: 'I agree with Eve, this is really intriguing! Bob, have you thought about the ethical implications of such accurate weather predictions? I can see this being incredibly beneficial for disaster preparedness, but I can also imagine scenarios where this information could be misused. For example, what if large corporations use it to manipulate markets related to weather-dependent industries? Or if it falls into the hands of bad actors who could use it for malicious purposes? Maybe we should discuss potential safeguards or guidelines for the responsible use of this technology.',
    timestamp: '10:20:45 AM',
  },
]

export function GroupChat() {
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [showScrollDown, setShowScrollDown] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      const newMsg = {
        id: messages.length + 1,
        userId: 1, // Assuming the current user is Alice
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      }
      setMessages([...messages, newMsg])
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
  }, [messages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex h-screen max-w-6xl mx-auto bg-background">
      {/* User list sidebar */}
      <div className="w-72 border-x border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Group Members</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="p-4 space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  {user.status === 'online' && (
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background"></span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                </div>
              </div>
            ))}
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
              {messages.map((message, index) => {
                const user = users.find((u) => u.id === message.userId)
                return (
                  <div
                    key={message.id}
                    className="flex items-start space-x-3"
                    ref={index === messages.length - 1 ? lastMessageRef : null}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>{user?.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {user?.name}{' '}
                        <span className="text-xs text-muted-foreground ml-2">
                          {message.timestamp}
                        </span>
                      </p>
                      <p className="text-sm mt-1">{message.text}</p>
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
