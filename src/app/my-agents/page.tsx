'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Star,
  Download,
  User,
  CheckCircle,
  Play,
  Pause,
  Trash2,
  Plus,
} from 'lucide-react'

interface UserAgent {
  id: string
  agent_id: string
  status: 'active' | 'paused' | 'expired'
  hired_at: string
  expires_at: string | null
  total_runs: number
  last_run_at: string | null
  agent: {
    id: string
    name: string
    slug: string
    display_name: string
    emoji: string | null
    color: string | null
    role: string
    category: string
  }
}

const API_URL = process.env.NEXT_PUBLIC_STORE_API || 'http://localhost:4001/api/store'

export default function MyAgentsPage() {
  const [agents, setAgents] = useState<UserAgent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const res = await fetch(`${API_URL}/user/agents`, {
        headers: {
          'X-User-Id': 'default-user', // TODO: Get from auth
        },
      })
      const data = await res.json()
      setAgents(data.data || [])
    } catch (error) {
      console.error('Failed to load agents:', error)
      setAgents(getMockAgents())
    } finally {
      setLoading(false)
    }
  }

  const handlePause = async (agentId: string) => {
    try {
      await fetch(`${API_URL}/user/agents/${agentId}/pause`, {
        method: 'PATCH',
        headers: {
          'X-User-Id': 'default-user',
        },
      })
      loadAgents()
    } catch (error) {
      console.error('Failed to pause agent:', error)
    }
  }

  const handleRemove = async (agentId: string) => {
    if (!confirm('Remove this agent from your collection?')) return
    
    try {
      await fetch(`${API_URL}/user/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': 'default-user',
        },
      })
      loadAgents()
    } catch (error) {
      console.error('Failed to remove agent:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const activeAgents = agents.filter(a => a.status === 'active')
  const pausedAgents = agents.filter(a => a.status === 'paused')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Agents</h1>
              <p className="text-sm text-muted-foreground">
                {activeAgents.length} active · {pausedAgents.length} paused
              </p>
            </div>
            <Link
              href="/store"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Hire Agent
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {agents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You haven't hired any agents yet
            </p>
            <Link
              href="/store"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Agents Store
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Agents */}
            {activeAgents.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Active Agents
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAgents.map((ua) => (
                    <AgentCard
                      key={ua.id}
                      userAgent={ua}
                      onPause={() => handlePause(ua.agent_id)}
                      onRemove={() => handleRemove(ua.agent_id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Paused Agents */}
            {pausedAgents.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Pause className="h-5 w-5 text-yellow-500" />
                  Paused Agents
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pausedAgents.map((ua) => (
                    <AgentCard
                      key={ua.id}
                      userAgent={ua}
                      onPause={() => handlePause(ua.agent_id)}
                      onRemove={() => handleRemove(ua.agent_id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AgentCard({
  userAgent,
  onPause,
  onRemove,
}: {
  userAgent: UserAgent
  onPause: () => void
  onRemove: () => void
}) {
  const { agent } = userAgent

  return (
    <div className="bg-card border border-border/40 rounded-xl p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: agent.color || '#1a1a2e' }}
        >
          {agent.emoji || '🤖'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{agent.display_name}</h3>
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                userAgent.status === 'active'
                  ? 'bg-green-500/20 text-green-500'
                  : 'bg-yellow-500/20 text-yellow-500'
              }`}
            >
              {userAgent.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground capitalize">
            {agent.role} · {agent.category}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
        <div className="text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            {userAgent.total_runs} runs
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/chat?agent=${agent.slug}`}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1 text-sm"
          >
            <Play className="h-3 w-3" />
            Chat
          </Link>
          <button
            onClick={onPause}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            title={userAgent.status === 'active' ? 'Pause' : 'Resume'}
          >
            <Pause className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function getMockAgents(): UserAgent[] {
  return [
    {
      id: '1',
      agent_id: 'agent-1',
      status: 'active',
      hired_at: '2026-03-10',
      expires_at: null,
      total_runs: 45,
      last_run_at: '2026-03-15',
      agent: {
        id: 'agent-1',
        name: 'code-reviewer',
        slug: 'code-reviewer',
        display_name: 'Code Reviewer',
        emoji: '🔍',
        color: '#1e3a5f',
        role: 'coder',
        category: 'engineering',
      },
    },
    {
      id: '2',
      agent_id: 'agent-2',
      status: 'active',
      hired_at: '2026-03-12',
      expires_at: null,
      total_runs: 12,
      last_run_at: '2026-03-14',
      agent: {
        id: 'agent-2',
        name: 'frontend-developer',
        slug: 'frontend-developer',
        display_name: 'Frontend Developer',
        emoji: '🎨',
        color: '#2d4a3e',
        role: 'coder',
        category: 'engineering',
      },
    },
    {
      id: '3',
      agent_id: 'agent-3',
      status: 'paused',
      hired_at: '2026-03-01',
      expires_at: null,
      total_runs: 89,
      last_run_at: '2026-03-10',
      agent: {
        id: 'agent-3',
        name: 'market-scout',
        slug: 'market-scout',
        display_name: 'Market Scout',
        emoji: '📊',
        color: '#3d2952',
        role: 'researcher',
        category: 'marketing',
      },
    },
  ]
}