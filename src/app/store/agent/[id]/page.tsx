'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Star,
  Download,
  User,
  CheckCircle,
  Play,
  Share2,
  GitBranch,
  ArrowLeft,
  Zap,
  Shield,
  TrendingUp,
} from 'lucide-react'

interface Agent {
  id: string
  name: string
  slug: string
  display_name: string
  description: string
  long_description: string | null
  category: string
  role: string
  tags: string[]
  image_url: string | null
  cover_url: string | null
  emoji: string | null
  color: string | null
  version: string
  is_verified: boolean
  is_featured: boolean
  avg_rating: number | null
  review_count: number
  run_count: number
  success_rate: number | null
  creator: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    bio: string | null
    is_verified: boolean
    tier: string
  } | null
  versions: Array<{
    id: string
    version: string
    changelog: string | null
    is_published: boolean
    published_at: string | null
  }>
  skills: string[]
  mcp_tools: Array<{ name: string; description: string }>
  actions: Array<{ name: string; description: string }>
}

interface Review {
  id: string
  user_id: string
  rating: number
  body: string | null
  is_verified_run: boolean
  helpful_count: number
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_STORE_API || 'http://localhost:4001/api/store'

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'versions'>('overview')

  useEffect(() => {
    loadAgent()
    loadReviews()
  }, [params.id])

  const loadAgent = async () => {
    try {
      const res = await fetch(`${API_URL}/agents/${params.id}`)
      const data = await res.json()
      setAgent(data)
    } catch (error) {
      console.error('Failed to load agent:', error)
      setAgent(getMockAgent())
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/reviews/${params.id}`)
      const data = await res.json()
      setReviews(data.data || [])
    } catch (error) {
      setReviews(getMockReviews())
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-48 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-muted-foreground">Agent not found</p>
          <Link href="/store" className="text-primary hover:underline">
            Back to Store
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover */}
      <div 
        className="h-48 relative"
        style={{ background: agent.color ? `linear-gradient(135deg, ${agent.color}, #0a0a0f)` : 'linear-gradient(135deg, #1a1a2e, #0a0a0f)' }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-4 left-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-1.5 bg-black/50 rounded-lg hover:bg-black/70 transition-colors text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        {/* Header */}
        <div className="bg-card border border-border/40 rounded-xl p-6 mb-6">
          <div className="flex gap-6">
            {/* Avatar */}
            <div 
              className="w-24 h-24 rounded-xl flex items-center justify-center text-4xl shrink-0"
              style={{ backgroundColor: agent.color || '#1a1a2e' }}
            >
              {agent.emoji || '🤖'}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{agent.display_name || agent.name}</h1>
                {agent.is_verified && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
                {agent.is_featured && (
                  <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-500 rounded-full">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mb-2">
                by{' '}
                {agent.creator ? (
                  <Link 
                    href={`/store/creator/${agent.creator.username}`}
                    className="text-primary hover:underline"
                  >
                    {agent.creator.display_name}
                  </Link>
                ) : (
                  'Unknown'
                )}
              </p>
              <p className="text-muted-foreground capitalize">
                {agent.role} • {agent.category} • v{agent.version}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4">
                {agent.avg_rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold">{agent.avg_rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({agent.review_count})</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Download className="h-5 w-5" />
                  <span>{formatNumber(agent.run_count)} runs</span>
                </div>
                {agent.success_rate && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Zap className="h-5 w-5 text-green-500" />
                    <span>{(agent.success_rate * 100).toFixed(1)}% success</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-semibold">
                <Play className="h-4 w-4" />
                Hire Agent
              </button>
              <button className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                GitBranch
              </button>
              <button className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-border/40">
          {(['overview', 'reviews', 'versions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-card border border-border/40 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-3">About</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {agent.long_description || agent.description}
                  </p>
                </div>

                {/* Skills */}
                {agent.skills && agent.skills.length > 0 && (
                  <div className="bg-card border border-border/40 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-3">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {agent.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-muted rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tools */}
                {agent.mcp_tools && agent.mcp_tools.length > 0 && (
                  <div className="bg-card border border-border/40 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-3">Tools</h2>
                    <div className="space-y-2">
                      {agent.mcp_tools.map((tool) => (
                        <div key={tool.name} className="flex items-start gap-2">
                          <Zap className="h-4 w-4 mt-1 text-primary" />
                          <div>
                            <p className="font-medium">{tool.name}</p>
                            <p className="text-sm text-muted-foreground">{tool.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {agent.actions && agent.actions.length > 0 && (
                  <div className="bg-card border border-border/40 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-3">Actions</h2>
                    <div className="space-y-2">
                      {agent.actions.map((action) => (
                        <div key={action.name} className="flex items-start gap-2">
                          <Play className="h-4 w-4 mt-1 text-primary" />
                          <div>
                            <p className="font-medium">{action.name}</p>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="bg-card border border-border/40 rounded-xl p-6 text-center text-muted-foreground">
                    No reviews yet
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-card border border-border/40 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted'
                              }`}
                            />
                          ))}
                        </div>
                        {review.is_verified_run && (
                          <span className="flex items-center gap-1 text-xs text-green-500">
                            <CheckCircle className="h-3 w-3" />
                            Verified Run
                          </span>
                        )}
                      </div>
                      {review.body && (
                        <p className="text-muted-foreground mb-2">{review.body}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{review.user_id}</span>
                        <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {review.helpful_count} helpful
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'versions' && (
              <div className="space-y-3">
                {agent.versions?.map((v) => (
                  <div key={v.id} className="bg-card border border-border/40 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">v{v.version}</p>
                      {v.changelog && (
                        <p className="text-sm text-muted-foreground">{v.changelog}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {v.is_published ? (
                        <span className="flex items-center gap-1 text-green-500 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Published
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Draft</span>
                      )}
                      {v.published_at && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(v.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Tags */}
            <div className="bg-card border border-border/40 rounded-xl p-4">
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {agent.tags?.map((tag) => (
                  <Link
                    key={tag}
                    href={`/store?tag=${tag}`}
                    className="px-2 py-1 bg-muted rounded text-sm hover:bg-muted/80 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Creator */}
            {agent.creator && (
              <div className="bg-card border border-border/40 rounded-xl p-4">
                <h3 className="font-semibold mb-3">Creator</h3>
                <Link
                  href={`/store/creator/${agent.creator.username}`}
                  className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-1">
                      {agent.creator.display_name}
                      {agent.creator.is_verified && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {agent.creator.tier}
                    </p>
                  </div>
                </Link>
              </div>
            )}

            {/* Trust */}
            <div className="bg-card border border-border/40 rounded-xl p-4">
              <h3 className="font-semibold mb-3">Trust & Safety</h3>
              <div className="space-y-2 text-sm">
                {agent.is_verified && (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    Verified Agent
                  </div>
                )}
                {agent.success_rate && agent.success_rate > 0.95 && (
                  <div className="flex items-center gap-2 text-green-500">
                    <Shield className="h-4 w-4" />
                    High Success Rate
                  </div>
                )}
                {agent.run_count > 10000 && (
                  <div className="flex items-center gap-2 text-blue-500">
                    <TrendingUp className="h-4 w-4" />
                    Popular Agent
                  </div>
                )}
              </div>
            </div>
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

function getMockAgent(): Agent {
  return {
    id: '1',
    name: 'code-reviewer',
    slug: 'code-reviewer',
    display_name: 'Code Reviewer',
    description: 'Expert code reviewer that checks for bugs, security issues, performance problems, and best practices.',
    long_description: `This agent performs comprehensive code reviews across multiple programming languages.

**Features:**
- Security vulnerability detection
- Performance optimization suggestions
- Best practices enforcement
- Code style consistency checks
- Documentation recommendations

**Supported Languages:**
TypeScript, JavaScript, Python, Go, Rust, Elixir, and more.`,
    category: 'engineering',
    role: 'coder',
    tags: ['code-review', 'security', 'best-practices', 'performance', 'quality'],
    image_url: null,
    cover_url: null,
    emoji: '🔍',
    color: '#1e3a5f',
    version: '1.0.0',
    is_verified: true,
    is_featured: true,
    avg_rating: 4.8,
    review_count: 156,
    run_count: 12500,
    success_rate: 0.97,
    creator: {
      id: '1',
      username: 'aitlas',
      display_name: 'Aitlas',
      avatar_url: null,
      bio: 'Official Aitlas agents',
      is_verified: true,
      tier: 'partner'
    },
    versions: [
      { id: '1', version: '1.0.0', changelog: 'Initial release', is_published: true, published_at: '2026-03-01' }
    ],
    skills: ['code-review', 'security-analysis', 'performance-profiling'],
    mcp_tools: [
      { name: 'github', description: 'Read repositories, create PRs, post comments' },
      { name: 'filesystem', description: 'Read and write files' }
    ],
    actions: [
      { name: 'f.guard', description: 'Security scanning' }
    ]
  }
}

function getMockReviews(): Review[] {
  return [
    {
      id: '1',
      user_id: 'user_123',
      rating: 5,
      body: 'Excellent code reviewer! Caught several security issues I missed. Highly recommend for any team.',
      is_verified_run: true,
      helpful_count: 24,
      created_at: '2026-03-10'
    },
    {
      id: '2',
      user_id: 'user_456',
      rating: 4,
      body: 'Great for catching common issues. Sometimes a bit verbose but overall very useful.',
      is_verified_run: true,
      helpful_count: 8,
      created_at: '2026-03-08'
    }
  ]
}