'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  User,
  CheckCircle
} from 'lucide-react'

interface Agent {
  id: string
  name: string
  slug: string
  display_name: string
  description: string
  category: string
  role: string
  tags: string[]
  image_url: string | null
  emoji: string | null
  color: string | null
  version: string
  avg_rating: number | null
  review_count: number
  run_count: number
  creator: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    is_verified: boolean
    tier: string
  } | null
}

interface Category {
  id: string
  name: string
  count: number
}

const API_URL = process.env.NEXT_PUBLIC_STORE_API || 'http://localhost:4001/api/store'

export default function StorePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  useEffect(() => {
    loadAgents()
    loadCategories()
  }, [selectedCategory, selectedRole])

  const loadAgents = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedRole) params.append('role', selectedRole)
      if (search) params.append('q', search)
      
      const res = await fetch(`${API_URL}/agents?${params}`)
      const data = await res.json()
      setAgents(data.data || [])
    } catch (error) {
      console.error('Failed to load agents:', error)
      // Use mock data if API not available
      setAgents(getMockAgents())
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`)
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      setCategories(getMockCategories())
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadAgents()
  }

  const roles = [
    { id: 'researcher', name: 'Researcher', icon: '🔍' },
    { id: 'coder', name: 'Coder', icon: '💻' },
    { id: 'analyst', name: 'Analyst', icon: '📊' },
    { id: 'writer', name: 'Writer', icon: '✍️' },
    { id: 'operator', name: 'Operator', icon: '⚙️' },
    { id: 'trader', name: 'Trader', icon: '📈' },
    { id: 'guardian', name: 'Guardian', icon: '🛡️' },
    { id: 'advisor', name: 'Advisor', icon: '💡' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Agents Store</h1>
              <p className="text-sm text-muted-foreground">
                Discover and hire AI agents for any task
              </p>
            </div>
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Filters */}
          <aside className="w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Roles */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  By Role
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedRole(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedRole ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    All Roles
                  </button>
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        selectedRole === role.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                      }`}
                    >
                      <span>{role.icon}</span>
                      {role.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-semibold mb-3">Categories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedCategory ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between ${
                        selectedCategory === cat.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                      }`}
                    >
                      <span className="capitalize">{cat.name}</span>
                      <span className="text-muted-foreground text-sm">{cat.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No agents found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/store/agent/${agent.slug || agent.id}`}
                    className="group"
                  >
                    <div className="bg-card border border-border/40 rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all h-full">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: agent.color || '#1a1a2e' }}
                        >
                          {agent.emoji || '🤖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                            {agent.display_name || agent.name}
                          </h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {agent.role} • {agent.category}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {agent.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(agent.tags || []).slice(0, 3).map((tag) => (
                          <span 
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-muted rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border/40">
                        <div className="flex items-center gap-3">
                          {agent.avg_rating && (
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              {agent.avg_rating.toFixed(1)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            {formatNumber(agent.run_count)}
                          </span>
                        </div>
                        {agent.creator && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {agent.creator.display_name}
                            {agent.creator.is_verified && (
                              <CheckCircle className="h-3 w-3 text-blue-500" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
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

function getMockAgents(): Agent[] {
  return [
    {
      id: '1',
      name: 'code-reviewer',
      slug: 'code-reviewer',
      display_name: 'Code Reviewer',
      description: 'Expert code reviewer that checks for bugs, security issues, performance problems, and best practices.',
      category: 'engineering',
      role: 'coder',
      tags: ['code-review', 'security', 'best-practices'],
      image_url: null,
      emoji: '🔍',
      color: '#1e3a5f',
      version: '1.0.0',
      avg_rating: 4.8,
      review_count: 156,
      run_count: 12500,
      creator: { id: '1', username: 'aitlas', display_name: 'Aitlas', avatar_url: null, is_verified: true, tier: 'partner' }
    },
    {
      id: '2',
      name: 'market-scout',
      slug: 'market-scout',
      display_name: 'Market Scout',
      description: 'Deep market research agent that analyzes trends, competitors, and opportunities.',
      category: 'marketing',
      role: 'researcher',
      tags: ['market-research', 'competitor-analysis', 'trends'],
      image_url: null,
      emoji: '📊',
      color: '#2d4a3e',
      version: '1.2.0',
      avg_rating: 4.6,
      review_count: 89,
      run_count: 8200,
      creator: { id: '2', username: 'datawhiz', display_name: 'DataWhiz', avatar_url: null, is_verified: true, tier: 'verified' }
    },
    {
      id: '3',
      name: 'finance-analyst',
      slug: 'finance-analyst',
      display_name: 'Finance Analyst',
      description: 'Analyzes financial data, builds models, and generates investment insights.',
      category: 'data-ai',
      role: 'analyst',
      tags: ['finance', 'data-analysis', 'investing'],
      image_url: null,
      emoji: '📈',
      color: '#3d2952',
      version: '2.0.0',
      avg_rating: 4.9,
      review_count: 234,
      run_count: 45000,
      creator: { id: '1', username: 'aitlas', display_name: 'Aitlas', avatar_url: null, is_verified: true, tier: 'partner' }
    },
  ]
}

function getMockCategories(): Category[] {
  return [
    { id: 'engineering', name: 'engineering', count: 45 },
    { id: 'marketing', name: 'marketing', count: 23 },
    { id: 'data-ai', name: 'data-ai', count: 38 },
    { id: 'sales', name: 'sales', count: 15 },
    { id: 'product', name: 'product', count: 19 },
  ]
}