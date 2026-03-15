'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  CheckCircle,
  ExternalLink,
  Star,
  Download,
} from 'lucide-react'

interface Creator {
  id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  website_url: string | null
  tier: string
  is_verified: boolean
  agent_count: number
  total_earnings: number
  created_at: string
  agents: Array<{
    id: string
    name: string
    slug: string
    display_name: string
    description: string
    emoji: string | null
    color: string | null
    avg_rating: number | null
    run_count: number
  }>
}

const API_URL = process.env.NEXT_PUBLIC_STORE_API || 'http://localhost:4001/api/store'

export default function CreatorPage() {
  const params = useParams()
  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCreator()
  }, [params.username])

  const loadCreator = async () => {
    try {
      const res = await fetch(`${API_URL}/creators/${params.username}`)
      const data = await res.json()
      setCreator(data)
    } catch (error) {
      console.error('Failed to load creator:', error)
      setCreator(getMockCreator())
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground">Creator not found</p>
          <Link href="/store" className="text-primary hover:underline">
            Back to Store
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-card border border-border/40 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              {creator.avatar_url ? (
                <img 
                  src={creator.avatar_url} 
                  alt={creator.display_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{creator.display_name}</h1>
                {creator.is_verified && (
                  <CheckCircle className="h-6 w-6 text-blue-500" />
                )}
              </div>
              <p className="text-muted-foreground">@{creator.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                  creator.tier === 'partner' ? 'bg-purple-500/20 text-purple-500' :
                  creator.tier === 'verified' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {creator.tier}
                </span>
                <span className="text-muted-foreground text-sm">
                  {creator.agent_count} agents
                </span>
              </div>
            </div>
            {creator.website_url && (
              <a
                href={creator.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Website
              </a>
            )}
          </div>
          {creator.bio && (
            <p className="mt-4 text-muted-foreground">{creator.bio}</p>
          )}
        </div>

        {/* Agents */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Agents by {creator.display_name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creator.agents?.map((agent) => (
              <Link
                key={agent.id}
                href={`/store/agent/${agent.slug || agent.id}`}
                className="bg-card border border-border/40 rounded-xl p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: agent.color || '#1a1a2e' }}
                  >
                    {agent.emoji || '🤖'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{agent.display_name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {agent.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {agent.avg_rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {agent.avg_rating.toFixed(1)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {formatNumber(agent.run_count)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function getMockCreator(): Creator {
  return {
    id: '1',
    username: 'aitlas',
    display_name: 'Aitlas',
    bio: 'Official Aitlas agents built by the Aitlas team. Production-ready, thoroughly tested, and continuously improved.',
    avatar_url: null,
    website_url: 'https://aitlas.xyz',
    tier: 'partner',
    is_verified: true,
    agent_count: 12,
    total_earnings: 0,
    created_at: '2026-01-01',
    agents: [
      {
        id: '1',
        name: 'code-reviewer',
        slug: 'code-reviewer',
        display_name: 'Code Reviewer',
        description: 'Expert code reviewer for security, performance, and best practices.',
        emoji: '🔍',
        color: '#1e3a5f',
        avg_rating: 4.8,
        run_count: 12500
      },
      {
        id: '2',
        name: 'finance-analyst',
        slug: 'finance-analyst',
        display_name: 'Finance Analyst',
        description: 'Analyzes financial data and generates investment insights.',
        emoji: '📈',
        color: '#3d2952',
        avg_rating: 4.9,
        run_count: 45000
      }
    ]
  }
}