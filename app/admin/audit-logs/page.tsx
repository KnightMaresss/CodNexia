'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Activity,
  Search,
  Shield,
  UserCog,
  Trash2,
  Repeat,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  Clock,
  User,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PremiumPageShell from '@/components/PremiumPageShell'
type AuditLog = {
  id: string
  action: string
  actor: {
    id?: string | null
    email?: string | null
    name?: string | null
    role?: string | null
  }
  targetType: string
  targetId?: string | null
  message: string
  metadata?: Record<string, unknown>
  createdAt: string
}

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

function getActionIcon(action: string) {
  if (action === 'USER_ROLE_CHANGED') return UserCog
  if (action === 'ORDER_DELETED') return Trash2
  if (action === 'ORDER_REASSIGNED') return Repeat
  if (action === 'ORDER_ACCEPTED') return CheckCircle2
  if (action === 'ORDER_TIMELINE_UPDATED') return Clock
  if (action === 'ORDER_QUOTE_UPDATED') return DollarSign
  if (action === 'ORDER_PRICE_UPDATED') return DollarSign
  if (action === 'ORDER_PAYMENT_STATUS_UPDATED') return CreditCard
  if (action === 'ORDER_STATUS_UPDATED') return Activity

  return Activity
}

function getActionLabel(action: string) {
  return action
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getActionStyles(action: string) {
  if (action.includes('DELETED')) {
    return {
      iconBox: 'bg-red-500/10',
      icon: 'text-red-500',
      badge: 'bg-red-500/10 text-red-600 dark:text-red-400',
      border: 'border-red-500/30',
    }
  }

  if (action.includes('ACCEPTED') || action.includes('COMPLETED')) {
    return {
      iconBox: 'bg-emerald-500/10',
      icon: 'text-emerald-500',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20',
    }
  }

  if (action.includes('ROLE')) {
    return {
      iconBox: 'bg-yellow-500/10',
      icon: 'text-yellow-500',
      badge: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-500/20',
    }
  }

  if (action.includes('PAYMENT') || action.includes('PRICE')) {
    return {
      iconBox: 'bg-purple-500/10',
      icon: 'text-purple-500',
      badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/20',
    }
  }

  return {
    iconBox: 'bg-blue-500/10',
    icon: 'text-blue-500',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    border: 'border-border',
  }
}

function getRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`

  return date.toLocaleDateString()
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name || email || 'Unknown'

  return source
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true)

      try {
        const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=20`)
        const data = await res.json()

        if (data.success) {
          setLogs(data.logs)
          setPagination(data.pagination)
        }
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [page])

  const actions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action)))
  }, [logs])

  const stats = useMemo(() => {
    return {
      total: pagination.total,
      roleChanges: logs.filter((log) => log.action.includes('ROLE')).length,
      orderUpdates: logs.filter((log) => log.action.includes('ORDER')).length,
      deletes: logs.filter((log) => log.action.includes('DELETED')).length,
    }
  }, [logs, pagination.total])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchTerm = search.toLowerCase()

      const matchesSearch =
        log.message.toLowerCase().includes(searchTerm) ||
        log.actor.email?.toLowerCase().includes(searchTerm) ||
        log.actor.name?.toLowerCase().includes(searchTerm) ||
        log.targetId?.toLowerCase().includes(searchTerm) ||
        log.action.toLowerCase().includes(searchTerm)

      const matchesAction =
        actionFilter === 'all' || log.action === actionFilter

      return matchesSearch && matchesAction
    })
  }, [logs, search, actionFilter])

  function exportCsv() {
    const rows = filteredLogs.map((log) => ({
      action: getActionLabel(log.action),
      actor: log.actor.name || log.actor.email || 'Unknown',
      role: log.actor.role || '',
      targetType: log.targetType,
      targetId: log.targetId || '',
      message: log.message,
      createdAt: new Date(log.createdAt).toLocaleString(),
    }))

    const headers = Object.keys(
      rows[0] || {
        action: '',
        actor: '',
        role: '',
        targetType: '',
        targetId: '',
        message: '',
        createdAt: '',
      }
    )

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = String(row[header as keyof typeof row] || '')
            return `"${value.replaceAll('"', '""')}"`
          })
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `codnexia-audit-logs-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <PremiumPageShell className="px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="mb-5">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-600/10 p-3">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Audit Logs
                </h1>
                <p className="text-muted-foreground">
                  Monitor important founder and moderator actions across
                  Codnexia.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={exportCsv} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Total Logs</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">
                  Role Changes
                </p>
                <p className="text-3xl font-bold">{stats.roleChanges}</p>
              </div>
              <UserCog className="h-8 w-8 text-yellow-500" />
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">
                  Order Actions
                </p>
                <p className="text-3xl font-bold">{stats.orderUpdates}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">
                  Danger Actions
                </p>
                <p className="text-3xl font-bold">{stats.deletes}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:border-blue-500/30">
          <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_260px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search by message, actor, target, or action..."
                className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-2.5 pl-10 text-foreground outline-none transition focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All actions</option>
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {getActionLabel(action)}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recent Activity
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {filteredLogs.length}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading audit logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                No audit logs found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                  const Icon = getActionIcon(log.action)
                  const styles = getActionStyles(log.action)
                  const isExpanded = expandedLogId === log.id
                  const metadataEntries = Object.entries(log.metadata || {})

                  return (
                    <div
                      key={log.id}
                      className={`rounded-2xl border bg-background/50 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-background/80 hover:shadow-[0_12px_40px_rgba(37,99,235,0.10)] ${styles.border}`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <div className={`rounded-2xl p-3 ${styles.iconBox}`}>
                            <Icon className={`h-5 w-5 ${styles.icon}`} />
                          </div>

                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
                              >
                                {getActionLabel(log.action)}
                              </span>

                              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                {log.targetType}
                              </span>
                            </div>

                            <p className="font-semibold text-foreground">
                              {log.message}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                                  {getInitials(
                                    log.actor.name,
                                    log.actor.email
                                  )}
                                </div>

                                <span>
                                  By{' '}
                                  <span className="font-medium text-foreground">
                                    {log.actor.name ||
                                      log.actor.email ||
                                      'Unknown'}
                                  </span>
                                  {log.actor.role && (
                                    <span> · {log.actor.role}</span>
                                  )}
                                </span>
                              </div>

                              <span className="hidden sm:inline">•</span>

                              <div
                                title={new Date(log.createdAt).toLocaleString()}
                                className="flex items-center gap-1"
                              >
                                <Clock className="h-4 w-4" />
                                {getRelativeTime(log.createdAt)}
                              </div>
                            </div>

                            {log.targetId && (
                              <p className="mt-2 break-all text-xs text-muted-foreground">
                                Target ID: {log.targetId}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setExpandedLogId(isExpanded ? null : log.id)
                          }
                          className="shrink-0"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="mr-2 h-4 w-4" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-2 h-4 w-4" />
                              View Details
                            </>
                          )}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 rounded-2xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <User className="h-4 w-4 text-blue-500" />
                            Metadata
                          </h3>

                          {metadataEntries.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No metadata stored for this action.
                            </p>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                              {metadataEntries.map(([key, value]) => (
                                <div
                                  key={key}
                                  className="rounded-lg border border-border bg-background p-3"
                                >
                                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {key}
                                  </p>
                                  <pre className="whitespace-pre-wrap break-all text-sm text-foreground">
                                    {formatMetadataValue(value)}
                                  </pre>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ·{' '}
            {pagination.total} total logs
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Previous
            </Button>

            <Button
              variant="outline"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
   </PremiumPageShell>
  )
}