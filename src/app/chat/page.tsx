'use client'

import { Suspense } from 'react'
import { ChatPanel } from '@/components/chat/chat-panel'

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading chat...</div>}>
      <div className="h-[calc(100vh-3.5rem)]">
        <ChatPanel />
      </div>
    </Suspense>
  )
}
