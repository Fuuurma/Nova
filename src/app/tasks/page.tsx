'use client'

import { Suspense } from 'react'
import { TaskBoardPanel } from '@/components/panels/task-board-panel'

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading tasks...</div>}>
      <div className="h-[calc(100vh-3.5rem)] p-4">
        <TaskBoardPanel />
      </div>
    </Suspense>
  )
}
