'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

interface ChatEntryFormProps {
  onSubmit: (_userName: string, _groupName: string) => void
}

export function ChatEntryForm({ onSubmit }: ChatEntryFormProps) {
  const [userName, setUserName] = useState('')
  const [groupName, setGroupName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    console.log('handleSubmit:', userName, groupName)
    onSubmit(userName, groupName)
    e.preventDefault()
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          AI has entered the chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName">User Name</Label>
            <Input
              id="userName"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Join Chat
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
