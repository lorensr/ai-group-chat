'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChatEntryFormProps {
  onSubmit: (_userName: string, _groupName: string) => void
}

export function ChatEntryForm({ onSubmit }: ChatEntryFormProps) {
  const [userName, setUserName] = useState('')
  const [groupName, setGroupName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Pass the userName and groupName to the parent component
    onSubmit(userName, groupName)
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
            Enter Chat
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
