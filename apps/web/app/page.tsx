'use client'

import styles from './page.module.css'
import { GroupChat } from '../components/group-chat'
import { useState } from 'react'

export default function Home() {
  const [groupName, setGroupName] = useState('')
  const [userName, setUserName] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (groupName && userName) {
      setIsSubmitted(true)
    }
  }

  if (isSubmitted) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <GroupChat groupName={groupName} userName={userName} />
        </main>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <form onSubmit={handleSubmit}>
          <label>
            Group Name:
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </label>
          <br />
          <label>
            User Name:
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </label>
          <br />
          <button type="submit">Join Chat</button>
        </form>
      </main>
    </div>
  )
}
