'use client'
import { useEffect, useState, useMemo,useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent} from '@/components/ui/card'
import { Skeleton, StatsSkeleton, OrderCardSkeleton } from '@/components/ui/skeleton'
import { showToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { OrderMessages } from '@/components/OrderMessages'
import { SoundNotification } from '@/components/SoundNotification'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { canAccessAdmin, isFounderRole, isModeratorRole } from '@/lib/roles'
import { Shield } from 'lucide-react'

import {
  LogOut,
  Trash2,
  RefreshCw,
  Search,
  Clock,
  FileText,
  CheckCircle2,
  Package,
  DollarSign,
  Mail,
  Calendar,
  Loader2,
  ArrowUpDown,
  X,
  Download,
  MessageCircle,
  XCircle,
  Star,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react'

interface Order {
  _id: string
  studentEmail: string
  service: string
  requirements: string
  status: string
  price: number
  finalPrice?: number
  priority?: string
  paymentStatus?: string
  depositAmount?: number
  remainingAmount?: number
  commission?: number
  createdAt: string
  updatedAt: string
  assignedTo?: string  
  assignedToName?: string
  internalNote?: string
  noteUpdatedBy?: string
  noteUpdatedAt?: string  
  unreadMessages?: number
  hasUnreadMessages?: boolean
}

interface OrderFile {
  id: string
  name: string
  size: number
  url: string
}


const SERVICE_NAMES: Record<string, string> = {
  'graduation-projects': 'Graduation Projects',
  'academic-reports': 'Academic Reports',
  'custom-websites': 'Custom Websites',
  'mobile-apps': 'Mobile Apps',
  'powerpoint-presentations': 'PowerPoint Presentations',
  'cv-resume-writing': 'CV/Resume Writing',
  'translation': 'Translation (En↔Ar)',
  'code-debugging': 'Code Debugging',
}

type TabType = 'orders' | 'users' | 'completed' | 'ratings'
type StatusFilter = 'all' | 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'fully_paid'
type ServiceFilter = 'all' | keyof typeof SERVICE_NAMES
type SortOrder = 'newest' | 'oldest'


const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed (Awaiting Payment)' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'fully_paid', label: 'Completed & Paid' },
] as const

const SERVICE_OPTIONS = [
  { value: 'all', label: 'All Services' },
  ...Object.entries(SERVICE_NAMES).map(([value, label]) => ({ value, label })),
] as const
interface UserData {
  _id: string
  name: string
  email: string
  blocked?: boolean
  role?: string
  createdAt: string
  lastSeen?: string
  profilePic?: string
}
interface ModeratorStat {
  _id: string
  name: string
  email: string
  profilePic: string
  createdAt: string
  lastSeen?: string
  stats: {
    totalAssigned: number
    inProgress: number
    completed: number
    cancelled: number
    completionRate: number
  }
}
export default function AdminPage() {
  const [chatOrder, setChatOrder] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: '' })
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [orderFiles, setOrderFiles] = useState<Record<string, OrderFile[]>>({})
  const [loadingFiles, setLoadingFiles] = useState<string | null>(null) // ADD THIS: stores orderId being loaded
  const [activeTab, setActiveTab] = useState<TabType>('orders')
  const [userSearch, setUserSearch] = useState('')
  const [users, setUsers] = useState<UserData[]>([])
  const [playSound, setPlaySound] = useState(false)
  const prevOrderCount = useRef(orders.length)
  const mountedRef = useRef(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [settingPrice, setSettingPrice] = useState<string | null>(null)
  const [priceInput, setPriceInput] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)
  const [reassigningId, setReassigningId] = useState<string | null>(null)
  const [reassignModal, setReassignModal] = useState<{ open: boolean; orderId: string; currentName: string }>({ open: false, orderId: '', currentName: '' })
  const [moderatorStats, setModeratorStats] = useState<ModeratorStat[]>([])
  const router = useRouter()
  const knownOrderIdsRef = useRef<Set<string>>(new Set())
  const initializedOrdersRef = useRef(false)
  const previousUnreadTotalRef = useRef(0)
  const [userRole, setUserRole] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [streamConnected, setStreamConnected] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ratings, setRatings] = useState<Record<string, any>>({})
  
    const reassignOrder = async (orderId: string, newModId: string, newModName: string) => {
    setReassigningId(orderId)
    try {
      const res = await fetch('/api/orders/reassign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newModId, newModName }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Order reassigned to ${newModName}`, 'success')
        setReassignModal({ open: false, orderId: '', currentName: '' })
        fetchOrders()
      } else {
        showToast(data.error || 'Failed to reassign', 'error')
      }
    } catch {
      showToast('Failed to reassign', 'error')
    }
    setReassigningId(null)
  }

  
  const acceptOrder = async (orderId: string) => {
    setAcceptingId(orderId)
    try {
      const res = await fetch('/api/orders/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('Order accepted!', 'success')
        fetchOrders()
      } else {
        showToast(data.error || 'Failed to accept order', 'error')
      }
    } catch {
      showToast('Failed to accept order', 'error')
    }
    setAcceptingId(null)
  }

  const setFinalPrice = async (orderId: string) => {
    const price = parseFloat(priceInput)
    if (!price || price <= 0) {
      showToast('Please enter a valid price', 'error')
      return
    }
    setSavingPrice(true)
    try {
      const deposit = parseFloat((price * 0.2).toFixed(2))
      const remaining = parseFloat((price * 0.8).toFixed(2))
      const commission = deposit
      
      const res = await fetch('/api/orders/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId, 
          finalPrice: price,
          depositAmount: deposit,
          remainingAmount: remaining,
          commission: commission
        }),
      })
      const data = await res.json()
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, finalPrice: price, depositAmount: deposit, remainingAmount: remaining, commission } : o
          )
        )
        setSettingPrice(null)
        setPriceInput('')
        showToast(`Price set to $${price}. 20% deposit: $${deposit}`, 'success')
      }
    } catch {
      showToast('Failed to set price', 'error')
    }
    setSavingPrice(false)
  }

  const saveNote = async (orderId: string) => {
    setSavingNote(true)
    try {
      const res = await fetch('/api/orders/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, note: noteText }),
      })
      const data = await res.json()
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, internalNote: noteText.trim() } : o
          )
        )
        setEditingNote(null)
        setNoteText('')
        showToast('Note saved!', 'success')
      }
    } catch {
      showToast('Failed to save note', 'error')
    }
    setSavingNote(false)
  }
const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      
     if (data.success) {
  const unreadTotal = data.orders.reduce(
    (sum: number, order: Order) => sum + (order.unreadMessages || 0),
    0
  )
const nextOrderIds = new Set<string>(
  data.orders.map((order: Order) => order._id)
)

const hasNewOrder =
  initializedOrdersRef.current &&
  data.orders.some((order: Order) => !knownOrderIdsRef.current.has(order._id))

if (hasNewOrder) {
  setPlaySound(true)
  setTimeout(() => setPlaySound(false), 100)
  showToast('New order received!', 'success')
}

knownOrderIdsRef.current = nextOrderIds
initializedOrdersRef.current = true
  if (!chatOrder && unreadTotal > previousUnreadTotalRef.current) {
    const audio = new Audio('/chat.mp3')
    audio.play().catch(() => {})
    showToast('New chat message received', 'success')
  }

  previousUnreadTotalRef.current = unreadTotal
  setOrders(data.orders)
}
      else {
       
        console.error(data.error || 'Failed to fetch orders')
      }
    } catch {
     
      console.error('Failed to fetch orders')
    }
  }
const fetchRatings = async () => {
    try {
      const res = await fetch('/api/ratings')
      const data = await res.json()
      if (data.success && data.ratings) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ratingsMap: Record<string, any> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.ratings.forEach((r: any) => {
          ratingsMap[r.orderId] = r
        })
        setRatings(ratingsMap)
      }
    } catch {}
  }
const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
    
      
      if (data.success) {
        setUsers(data.users)
      } else {
        console.error('❌ API error:', data.error)
      }
    } catch {
    }
  }
const fetchModeratorStats = async () => {
    try {
      const res = await fetch('/api/admin/moderator-stats')
      const data = await res.json()
      if (data.success) {
        setModeratorStats(data.moderators)
      }
    } catch {}
  }
    const toggleBlockUser = async (userId: string, currentBlocked: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, blocked: !currentBlocked }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(currentBlocked ? 'User unblocked' : 'User blocked', 'success')
        fetchUsers()
      }
    } catch {
      showToast('Failed to update user', 'error')
    }
  }
  const setRole = async (userId: string, email: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: newRole }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(newRole === 'moderator' ? 'User is now a moderator' : 'Moderator removed', 'success')
        fetchUsers()
      } else {
        showToast(data.error || 'Failed to update role', 'error')
      }
    } catch {
      showToast('Failed to update role', 'error')
    }
  }

const fetchFiles = async (orderId: string) => {
   
    
    if (orderFiles[orderId]) {
    
      setExpandedOrder(expandedOrder === orderId ? null : orderId)
      return
    }

    setLoadingFiles(orderId)
 
    
    try {
      const res = await fetch(`/api/files?orderId=${orderId}`)
      const data = await res.json()
      if (data.success && data.files) {
        setOrderFiles((prev) => ({ ...prev, [orderId]: data.files }))
        setExpandedOrder(orderId)
      
      } else {
        // No files, still expand but show empty
        setOrderFiles((prev) => ({ ...prev, [orderId]: [] }))
        setExpandedOrder(orderId)
       
      }
    } catch {   
    }
    setLoadingFiles(null)
  }

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')



useEffect(() => {
  if (!authenticated) return

const startTimeout = setTimeout(() => {
  setStreamConnected(true)
  fetchOrders()
  fetchRatings()

  if (isFounderRole(userRole)) {
    fetchUsers()
    fetchModeratorStats()
  }
}, 0)


  const interval = setInterval(() => {
    fetchOrders()
    fetchRatings()

    if (isFounderRole(userRole)) {
      fetchUsers()
      fetchModeratorStats()
    }
  }, 3000)

  return () => {
    setStreamConnected(false)
   clearTimeout(startTimeout)
   clearInterval(interval)
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [authenticated, userRole])










  // Auto-open chat from email link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chatId = params.get('chat')
    if (chatId) {
     // eslint-disable-next-line react-hooks/set-state-in-effect
      setChatOrder(chatId)
    }
  }, [])
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

useEffect(() => {
  // Skip sound on initial load (when prevOrderCount is 0 and we're loading orders for first time)
  const isInitialLoad = prevOrderCount.current === 0 && orders.length > 0
  
  const newOrders = orders.length - prevOrderCount.current
  
  if (!isInitialLoad && newOrders > 0 && prevOrderCount.current >= 0) {
    const newPending = orders.filter(o => o.status === 'pending' && !o.assignedTo).length
    if (newPending > 0 || newOrders > 0) {
      setPlaySound(true)
      setTimeout(() => setPlaySound(false), 100)
    }
  }
  prevOrderCount.current = orders.length
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [orders.length]) 



useEffect(() => {
    // mountedRef is already true from initialization
    return () => {
      mountedRef.current = false
    }
}, [])
 

 useEffect(() => {
  fetch('/api/auth/student-check')
    .then((res) => res.json())
    .then((userData) => {
      if (!userData.authenticated) {
        setAuthenticated(false)
        setLoading(false)
        return
      }

      const role = userData.user?.role || ''

      setUserRole(role)
      setCurrentUserId(userData.user?.id || '')

   if (!canAccessAdmin(role)) {
  router.push('/unauthorized')
  return
}
      setAuthenticated(true)
      setLoading(false)

      if (canAccessAdmin(role)) {
        fetchUsers()
      }
    })
}, [router])

 // Update lastSeen for moderator/founder when they visit admin
useEffect(() => {
    if (authenticated && (canAccessAdmin(userRole))) {
      fetch('/api/admin/update-lastseen', { method: 'POST' }).catch(() => {})
    }
  }, [authenticated, userRole])

const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch('/api/orders/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: newStatus } : o
          )
        )
        const labels: Record<string, string> = {
          'in-progress': 'Order marked as In Progress',
          'completed': 'Order marked as Completed',
        }
        showToast(labels[newStatus] || `Status updated to ${newStatus}`, 'success')
      } else {
        showToast(data.error || 'Failed to update order', 'error')
      }
    } catch {
      showToast('Failed to update order', 'error')
    }
    setUpdatingId(null)
  }




  const deleteOrder = async (orderId: string) => {
    setDeleteModal({ open: true, orderId })
  }

const confirmDelete = async () => {
    const orderId = deleteModal.orderId
    setDeleteModal({ open: false, orderId: '' })

    try {
      const res = await fetch('/api/orders/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o._id !== orderId))
        showToast('Order deleted successfully', 'success')
      } else {
       
        showToast(data.error || 'Failed to delete order', 'error')
      }
    } catch  {
     
      showToast('Failed to delete order', 'error')
    }
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />
      case 'in-progress':
        return <FileText className="h-3 w-3" />
      case 'completed':
        return <CheckCircle2 className="h-3 w-3" />
      case 'cancelled':
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }
  const getLastSeenText = (lastSeen?: string) => {
    if (!lastSeen) return null
    const now = new Date()
    const seen = new Date(lastSeen)
    const diffMs = now.getTime() - seen.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    
    if (diffMin < 5) return <span className="flex items-center gap-1 text-xs text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Online</span>
    if (diffMin < 60) return <span className="text-xs text-muted-foreground">{diffMin}m ago</span>
    const diffHrs = Math.floor(diffMin / 60)
    if (diffHrs < 24) return <span className="text-xs text-muted-foreground">{diffHrs}h ago</span>
    const diffDays = Math.floor(diffHrs / 24)
    return <span className="text-xs text-muted-foreground">{diffDays}d ago</span>
  }

const filteredOrders = useMemo(() => {
  let result = [...orders].filter(o => {
    // Hide completed orders only if they are fully paid
    if (o.status === 'completed' && o.paymentStatus === 'fully_paid') return false
    return true
  })
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    result = result.filter(
      (o) =>
        o.studentEmail.toLowerCase().includes(query) ||
        o._id.toLowerCase().includes(query) ||
        o.requirements.toLowerCase().includes(query)
    )
  }

  if (statusFilter !== 'all') {
    if (statusFilter === 'fully_paid') {
      result = result.filter((o) => o.status === 'completed' && o.paymentStatus === 'fully_paid')
    } else if (statusFilter === 'completed') {
      result = result.filter((o) => o.status === 'completed' && o.paymentStatus !== 'fully_paid')
    } else {
      result = result.filter((o) => o.status === statusFilter)
    }
  }
  
  if (serviceFilter !== 'all') {
    result = result.filter((o) => o.service === serviceFilter)
  }
  
  result.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })
  
  return result
}, [orders, searchQuery, statusFilter, serviceFilter, sortOrder])



  
const stats = useMemo(() => {
  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    inProgress: orders.filter((o) => o.status === 'in-progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    totalRevenue: orders
      .filter((o) => o.status === 'completed' && o.paymentStatus === 'fully_paid')
      .reduce((sum, o) => sum + (o.finalPrice || 0), 0),
    pendingRevenue: orders
      .filter((o) => o.status === 'in-progress' && o.paymentStatus === 'deposit_paid')
      .reduce((sum, o) => sum + (o.depositAmount || 0), 0),
  }
}, [orders])


const getServiceRange = (service: string) => {
  const ranges: Record<string, { min: number; max: number }> = {
    'graduation-projects': { min: 150, max: 400 },
    'academic-reports': { min: 50, max: 200 },
    'custom-websites': { min: 400, max: 1000 },
    'mobile-apps': { min: 500, max: 1500 },
    'powerpoint-presentations': { min: 30, max: 100 },
    'cv-resume-writing': { min: 50, max: 150 },
    'translation': { min: 20, max: 80 },
    'code-debugging': { min: 50, max: 300 },
  }
  return ranges[service] || { min: 0, max: 0 }
}

  if (loading) {
      return (
      <main className="min-h-screen pt-16 py-8 px-4 bg-gradient-to-br from-background to-muted">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          <StatsSkeleton />
          <div className="space-y-4 mt-6">
            {[...Array(3)].map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    )
  }

 if (!authenticated) {
  router.push('/login')
  return null
}
   return (
    <>
          {/* Reassign Modal */}
      {reassignModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Reassign Order</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Currently assigned to: <strong>{reassignModal.currentName}</strong>
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {users.filter(u => isModeratorRole(u.role) && !u.blocked).map((mod) => (
                <button
                  key={mod._id}
                  onClick={() => reassignOrder(reassignModal.orderId, mod._id, mod.name)}
                  disabled={reassigningId === reassignModal.orderId}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">
                    {mod.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{mod.name}</p>
                    <p className="text-xs text-muted-foreground">{mod.email}</p>
                  </div>
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setReassignModal({ open: false, orderId: '', currentName: '' })}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, orderId: '' })}
      />
      <SoundNotification play={playSound} />
      <main className="min-h-screen pt-20 py-8 px-4 bg-gradient-to-br from-background to-muted">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
              <h1 className="text-3xl font-bold text-foreground">
              {isFounderRole(userRole) ? 'Founder Dashboard' : 'Staff Dashboard'}
            </h1>
            
            <p className="text-muted-foreground mt-1">Manage orders and track progress</p>
          </div>
                <div className="flex items-center gap-3">
                <div
  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
    streamConnected
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
      : 'border-red-500/30 bg-red-500/10 text-red-600'
  }`}
>
  {streamConnected ? (
    <Wifi className="h-4 w-4" />
  ) : (
    <WifiOff className="h-4 w-4" />
  )}
  {streamConnected ? 'Live' : 'Offline'}
</div>

<Link href="/admin/audit-logs">
  <Button variant="outline" size="default">
    <Shield className="h-4 w-4 mr-1" />
    Audit Logs
  </Button>
</Link>
               {(canAccessAdmin(userRole)) && (
              <Link href="/profile">
                <Button variant="outline" size="default">
                  <User className="h-4 w-4 mr-1" />
                  My Profile
                </Button>
              </Link>
              
            )}
            
            <Button variant="outline" size="default" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="default" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>

      <div className="flex gap-2">
        <button
  onClick={() => {
    setActiveTab('orders')
    fetchOrders()
    if (isFounderRole(userRole)) fetchUsers()
  }}
  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
    activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-card text-foreground border border-border'
  }`}
>
 📦 Orders
  {stats.pending > 0 && (
    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
      {stats.pending} pending
    </span>
  )}
</button>
          {/* Completed tab - only for moderators */}
          {isModeratorRole(userRole) && (
            <button
             onClick={() => {
  setActiveTab('completed' as TabType)
  fetchRatings()
}}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'completed' ? 'bg-green-600 text-white' : 'bg-card text-foreground border border-border'
              }`}
            >
              ✅ My Completed
            </button>
          )}
                    {/* Ratings tab - only for founder */}
          {isFounderRole(userRole) && (
            <button
              onClick={() => {
                setActiveTab('ratings' as TabType)
                fetchRatings()
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ratings' ? 'bg-yellow-600 text-white' : 'bg-card text-foreground border border-border'
              }`}
            >
              ⭐ Ratings
            </button>
          )}
          {isFounderRole(userRole) && (
            
          <button

         onClick={() => {
  setActiveTab('users')
  fetchUsers()
  fetchModeratorStats()
}}

        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-card text-foreground border border-border'
         }`}
         >  
         👥 Users
        </button>
        
           )}

          </div>
                {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Users Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{users.length}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{users.filter(u => !u.blocked).length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-500">{users.filter(u => u.blocked).length}</p>
                  <p className="text-xs text-muted-foreground">Blocked</p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <input
                type="text"
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            {/* Moderator Performance - Only visible to Founder */}
            {isFounderRole(userRole) && moderatorStats.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  🏆 Moderator Performance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moderatorStats.map((mod) => (
                    <Card key={mod._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-lg font-bold text-purple-600">
                            {mod.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{mod.name}</p>
                              <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">{mod.email}</p>
                              {getLastSeenText(mod.lastSeen)}
                            </div>
                          </div>
                          {moderatorStats.indexOf(mod) === 0 && mod.stats.completed > 0 && (
                            <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">⭐ Top</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-blue-600">{mod.stats.totalAssigned}</p>
                            <p className="text-[10px] text-muted-foreground">Assigned</p>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-yellow-600">{mod.stats.inProgress}</p>
                            <p className="text-[10px] text-muted-foreground">In Progress</p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-green-600">{mod.stats.completed}</p>
                            <p className="text-[10px] text-muted-foreground">Completed</p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-red-500">{mod.stats.cancelled}</p>
                            <p className="text-[10px] text-muted-foreground">Cancelled</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Completion Rate</span>
                            <span className="text-sm font-bold text-green-600">{mod.stats.completionRate}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-green-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${mod.stats.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <h2 className="text-lg font-semibold text-foreground mt-6">All Users</h2>
              </div>
            )}
            {/* Users List */}
            <div className="space-y-2">
              {users
              .filter(u => !isFounderRole(u.role))
              .filter(u => 
                !userSearch || 
                u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                u.email.toLowerCase().includes(userSearch.toLowerCase())
              )
              .map((u) => (
                <Card key={u._id} className={`border-0 shadow-sm hover:shadow-md transition-shadow ${u.blocked ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">

                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden ${
                       u.blocked 
                       ? 'bg-red-100 text-red-600' 
                        : 'bg-blue-100 text-blue-600'
                           }`}>
                     {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(u as any).profilePic ? (
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              <Image src={(u as any).profilePic} 
                alt={u.name} 
                width={48} 
                height={48} 
                className="w-full h-full object-cover" 
                loading="eager" 
                fetchPriority="high"
                 />
                ) : (
                 u.name.charAt(0).toUpperCase()
                  )}
                    </div>

                      
                      <div>
                        <div className="flex items-center gap-2">
                         <Link href={`/profile?id=${u._id}`} className="font-semibold text-foreground hover:text-blue-600 hover:underline cursor-pointer">
                          {u.name}
                          </Link>
                          {u.blocked && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Blocked
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          {u.role === 'moderator' && getLastSeenText(u.lastSeen)}
                        </div>
                      </div>
                    </div>
                      <div className="flex items-center gap-2">
                      {/* Make Moderator / Remove Moderator button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRole(u._id, u.email, u.role === 'moderator' ? 'student' : 'moderator')}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                      >
                        {u.role === 'moderator' ? 'Remove Mod' : 'Make Mod'}
                      </Button>
                      {/* Block / Unblock button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleBlockUser(u._id, !!u.blocked)}
                        className={u.blocked 
                          ? 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200' 
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                        }
                      >
                        {u.blocked ? 'Unblock' : 'Block'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}



{/* Ratings Tab - Founder only */}
{activeTab === 'ratings' && isFounderRole(userRole) && (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
      ⭐ Completed Orders & Ratings
    </h2>
    {orders.filter(o => o.status === 'completed').length === 0 ? (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No completed orders yet</p>
        </CardContent>
      </Card>
    ) : (
      orders.filter(o => o.status === 'completed').map((order) => (
        <Card key={order._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-foreground text-lg">
                    {SERVICE_NAMES[order.service] || order.service}
                  </p>
                  {/* Payment Status Badge */}
                  {order.paymentStatus === 'fully_paid' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300">
                      💚 Fully Paid
                    </span>
                  ) : order.paymentStatus === 'deposit_paid' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">
                      💙 Deposit Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                      ✅ Completed
                    </span>
                  )}
                </div>
                
                {/* Email */}
                <div className="flex items-center gap-2 mt-2">
                  <Mail className="h-3 w-3 text-gray-400" />
                  <p className="text-sm text-muted-foreground">{order.studentEmail}</p>
                </div>
                
                {/* Date and Price */}
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                    <p className="text-xs font-bold text-green-600">
                      {order.finalPrice ? `$${order.finalPrice}` : `$${order.price}`}
                    </p>
                  </div>
                  {order.depositAmount && order.paymentStatus !== 'fully_paid' && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Deposit: ${order.depositAmount}</span>
                    </div>
                  )}
                </div>
                
                {/* Moderator info */}
                {order.assignedToName && (
                  <div className="flex items-center gap-1 mt-1">
                    <User className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-muted-foreground">
                      Moderator: {order.assignedToName}
                    </p>
                  </div>
                )}
                
                {/* Requirements preview */}
                {order.requirements && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Requirements:</p>
                    <p className="text-xs text-foreground bg-muted rounded p-2 mt-1 line-clamp-2">
                      {order.requirements.substring(0, 150)}{order.requirements.length > 150 ? '...' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Rating Section */}
            <div className="mt-4 pt-4 border-t">
              {ratings[order._id] ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= ratings[order._id].rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-yellow-600">{ratings[order._id].rating}/5</span>
                  {ratings[order._id].comment && (
                    <p className="text-xs text-muted-foreground italic">
                      “{ratings[order._id].comment}”
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground italic">No rating yet</span>
                </div>
              )}
            </div>
            
            {/* Files and Chat Buttons */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex gap-3">
              <button
  onClick={() => {
    setChatOrder(chatOrder === order._id ? null : order._id)

    if (chatOrder !== order._id) {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id
            ? { ...o, unreadMessages: 0, hasUnreadMessages: false }
            : o
        )
      )

      fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id }),
      }).catch(() => {})

      setTimeout(() => {
        document
          .getElementById(`chat-${order._id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }}
  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
>
  <MessageCircle className="h-3 w-3" />

  {order.hasUnreadMessages && (
    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {order.unreadMessages}
    </span>
  )}

  {chatOrder === order._id ? 'Hide Chat' : 'Chat'}
</button>
              </div>
              
              {/* Files List */}
              {expandedOrder === order._id && orderFiles[order._id] && (
                <div className="mt-3 space-y-1">
                  {orderFiles[order._id].length === 0 ? (
                    <p className="text-xs text-muted-foreground">No files attached</p>
                  ) : (
                    orderFiles[order._id].map((file) => (
                      <a
                        key={file.id}
                        href={`/api/files/download?id=${file.id}`}
                        download={file.name}
                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-950 rounded px-2 py-1"
                      >
                        <FileText className="h-3 w-3" />
                        {file.name}
                        <Download className="h-3 w-3 ml-auto" />
                      </a>
                    ))
                  )}
                </div>
              )}
              
              {/* Chat */}
              {chatOrder === order._id && (
                <div id={`chat-${order._id}`} className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-3">Messages</p>
                 <OrderMessages orderId={order._id} userName="admin" />
                </div>
              )}
            </div>
            
            {/* Delete button for founder */}
            <div className="mt-3 pt-3 border-t flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteOrder(order._id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Order
              </Button>
            </div>
          </CardContent>
        </Card>
      ))
    )}
  </div>
)}









       {/* Completed Orders Tab - Moderator only */}
       {activeTab === 'completed' && isModeratorRole(userRole) && (
         <div className="space-y-4">
           <h2 className="text-lg font-semibold text-foreground">✅ My Completed Orders</h2>
           {orders.filter(o => o.status === 'completed' && o.assignedTo === currentUserId).length === 0 ? (
             <Card className="border-0 shadow-sm">
               <CardContent className="py-16 text-center">
                 <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                 <p className="text-muted-foreground text-lg">No completed orders yet</p>
               </CardContent>
             </Card>
           ) : (
                        orders.filter(o => o.status === 'completed' && o.assignedTo === currentUserId).map((order) => (
               <Card key={order._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                 <CardContent className="p-6">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div>
                       <p className="font-semibold text-foreground">{SERVICE_NAMES[order.service] || order.service}</p>
                       <div className="flex items-center gap-2 mt-1">
                         <Mail className="h-3 w-3 text-gray-400" />
                         <p className="text-sm text-muted-foreground">{order.studentEmail}</p>
                       </div>
                       <div className="flex items-center gap-4 mt-1">
                         <p className="text-xs text-muted-foreground">
                           {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                         </p>
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                           <CheckCircle2 className="h-3 w-3" />
                           completed
                         </span>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="font-bold text-green-600 text-lg">${order.price}</p>
                     </div>
                   </div>
                      {ratings[order._id] && (
                     <div className="mt-3 pt-3 border-t flex items-center gap-2 flex-wrap">
                       <div className="flex">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <Star
                             key={star}
                             className={`h-4 w-4 ${star <= ratings[order._id].rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                           />
                         ))}
                       </div>
                       <span className="text-sm font-medium text-yellow-600">{ratings[order._id].rating}/5</span>
                       {ratings[order._id].comment && (
                         <p className="text-xs text-muted-foreground italic">
                           &ldquo;{ratings[order._id].comment}&rdquo;
                         </p>
                       )}
                     </div>
                   )}
                 </CardContent>
               </Card>
             ))
           )}
         </div>
       )}

       {activeTab === 'orders' && (
  <>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                   {[ 
            { label: 'Total', value: stats.total, icon: Package, color: 'bg-slate-100 text-slate-700', valueColor: 'text-foreground' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', valueColor: 'text-yellow-700 dark:text-yellow-400' },
            { label: 'In Progress', value: stats.inProgress, icon: FileText, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', valueColor: 'text-blue-700 dark:text-blue-400' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', valueColor: 'text-green-700 dark:text-green-400' },
            { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', valueColor: 'text-red-700 dark:text-red-400' },
            ...(isFounderRole(userRole) ? [
              { label: 'Revenue', value: `$${stats.totalRevenue}`, icon: DollarSign, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', valueColor: 'text-emerald-700 dark:text-emerald-400' }
            ] : []),
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.valueColor}`}>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}              
        </div>
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email, ID, or requirements..."
                  className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

  <select
  className="px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
>
  {STATUS_OPTIONS.map(option => (
    <option key={option.value} value={option.value}>{option.label}</option>
  ))}
</select>
<select
  className="px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
  value={serviceFilter}
  onChange={(e) => setServiceFilter(e.target.value as ServiceFilter)}
>
  {SERVICE_OPTIONS.map(option => (
    <option key={option.value} value={option.value}>{option.label}</option>
  ))}
</select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
                {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
              </Button>
            </div>
            {(searchQuery || statusFilter !== 'all' || serviceFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setServiceFilter('all')
                }}
                className="mt-3 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear all filters
              </button>
            )}
          </CardContent>
        </Card>

  {filteredOrders.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No orders found</p>
              <p className="text-muted-foreground text-sm">
                {orders.length === 0 ? 'No orders have been placed yet.' : 'Try adjusting your filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
            {filteredOrders.map((order) => (
              <Card key={order._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium truncate">{order.studentEmail}</p>
                        </div>
                      </div>
<div className="flex items-center gap-3">
  <Package className="h-4 w-4 text-gray-400 shrink-0" />
  <div>
    <p className="text-xs text-muted-foreground">Service</p>
    <p className="font-medium">{SERVICE_NAMES[order.service] || order.service}</p>
    {/* Show price range for pending OR in-progress orders without final price */}
    {!order.finalPrice && (order.status === 'pending' || order.status === 'in-progress') && (
      <p className="text-xs text-muted-foreground">
        Range: ${getServiceRange(order.service).min} - ${getServiceRange(order.service).max}
      </p>
    )}
  </div>
</div>
                    <div className="flex items-center gap-3">
  <DollarSign className="h-4 w-4 text-gray-400 shrink-0" />
  <div>
    <p className="text-xs text-muted-foreground">Price</p>
    <p className="font-bold text-green-600">
      {order.finalPrice ? `$${order.finalPrice}` : `$${order.price}`}
    </p>
    {order.finalPrice && order.depositAmount && (
      <p className="text-xs text-muted-foreground">
        20% deposit: ${order.depositAmount}
      </p>
    )}
  </div>
</div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="font-medium text-sm text-foreground">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                      <div className="flex items-center gap-3 lg:border-l lg:pl-6">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}> 
                          {getStatusIcon(order.status)}
                          {order.status === 'in-progress' ? 'In Progress' : order.status}                    
                        </span>
{/* Payment Status Badges */}
{order.paymentStatus === 'unpaid' && order.finalPrice && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-300">
    ⏳ Awaiting Deposit
  </span>
)}
{order.paymentStatus === 'deposit_paid' && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">
    💙 Deposit Paid (20%)
  </span>
)}
{order.paymentStatus === 'fully_paid' && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300">
    💚 Fully Paid
  </span>
)}
{/* Commission Display - Founder only */}
{isFounderRole(userRole) && order.commission && order.paymentStatus === 'fully_paid' && (
  <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
    Commission: ${order.commission}
  </span>
)}
                      <div className="flex items-center gap-2">   
                        {order.priority === 'urgent' && (
                          <span className="text-sm" title="Urgent">🔥🔥🔥</span>
                        )}
                        {order.priority === 'normal' && (
                          <span className="text-sm" title="Normal">🔥🔥</span>
                        )}
                        {order.priority === 'low' && (
                          <span className="text-sm" title="Low">🔥</span>
                        )}
                            {order.finalPrice && (
                          <span className="text-xs font-bold text-green-600">${order.finalPrice}</span>
                        )}

                           {order.assignedToName && (
                          <>
                          
                            <span className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              👤 {order.assignedToName}
                            </span>
                            {isFounderRole(userRole) && order.status !== 'completed' && order.status !== 'cancelled' && (
                              <button
                                onClick={() => setReassignModal({ open: true, orderId: order._id, currentName: order.assignedToName || '' })}
                                className="text-xs text-purple-600 hover:text-purple-800 underline"
                              >
                                Reassign
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    {/* Set Price - Only show if no payment made yet */}
                     {order.assignedToName && !order.finalPrice && order.paymentStatus === 'unpaid' && 
                      order.status !== 'completed' && order.status !== 'cancelled' && (
                        settingPrice === order._id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">$</span>
                            <input
                              type="number"
                              className="w-20 px-2 py-1 border border-input bg-background text-foreground rounded text-xs"
                              placeholder="Price"
                              value={priceInput}
                              onChange={(e) => setPriceInput(e.target.value)}
                            />
                            <Button
                              size="sm"
                              onClick={() => setFinalPrice(order._id)}
                              disabled={savingPrice}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white"
                            >
                              {savingPrice ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Set'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSettingPrice(null); setPriceInput('') }}
                              className="text-xs"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSettingPrice(order._id)}
                            className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                          >
                            💰 Set Price
                          </Button>
                        )
                      )}
                      {/* Accept button - show for pending/unassigned orders */}
                      {!order.assignedTo && order.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acceptOrder(order._id)}
                          disabled={acceptingId === order._id}
                          className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                        >
                          {acceptingId === order._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Accept Order'
                          )}
                        </Button>
                      )}
{/* Mark Complete - Only show if deposit paid */}
{order.status === 'in-progress' && order.paymentStatus === 'deposit_paid' && 
 (isFounderRole(userRole) || order.assignedTo === currentUserId) && (
  <Button
    size="sm"
    variant="outline"
    onClick={() => updateStatus(order._id, 'completed')}
    disabled={updatingId === order._id}
    className="text-xs bg-green-600 hover:bg-green-700 text-white"
  >
    {updatingId === order._id ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓ Mark Complete'}
  </Button>
)}

                      {/* Cancel - founder any, mod only THEIR assigned */}
                      {(isFounderRole(userRole) || (isModeratorRole(userRole) && order.assignedTo === currentUserId)) && order.status !== 'completed' && order.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(order._id, 'cancelled')}
                          disabled={updatingId === order._id}
                          className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                        >
                          Cancel
                        </Button>
                      )}

                      {/* Delete - only founder */}
                      {isFounderRole(userRole) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteOrder(order._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>


                  </div>

                  {order.requirements && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Requirements:</p>
                      <p className="text-sm text-foreground bg-muted rounded-lg p-3">
                        {order.requirements}
                      </p>
                    </div>
                  )}

                  {/* Internal Notes - founder always, mod only for assigned orders */}
                  {(isFounderRole(userRole) || (isModeratorRole(userRole) && order.assignedTo === currentUserId)) && (
                    <div className="mt-4 pt-4 border-t">
                      {editingNote === order._id ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
                            📝 Edit Note
                          </p>
                          <textarea
                            className="w-full px-3 py-2 border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 text-foreground rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-500 outline-none"
                            rows={2}
                            placeholder="Add internal note..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveNote(order._id)}
                              disabled={savingNote}
                              className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
                            >
                              {savingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setEditingNote(null); setNoteText('') }}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : order.internalNote ? (
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
                              📝 Internal Note
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                by {order.noteUpdatedBy || 'Staff'}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingNote(order._id)
                                  setNoteText(order.internalNote || '')
                                }}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-foreground">{order.internalNote}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingNote(order._id)
                            setNoteText('')
                          }}
                          className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                        >
                          📝 Add Internal Note
                        </button>
                      )}
                    </div>
                  )}

                  {/* Files and Chat - founder always, mod only for assigned orders */}
                  {(isFounderRole(userRole) || (isModeratorRole(userRole) && order.assignedTo === currentUserId)) && (
                    <>
                      <div className="mt-3">
                        <button
                          onClick={() => fetchFiles(order._id)}
                          disabled={loadingFiles === order._id}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                        >
                          {loadingFiles === order._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          {expandedOrder === order._id ? 'Hide Files' : 'View Files'}
                        </button>
<button
  onClick={() => {
    setChatOrder(chatOrder === order._id ? null : order._id)

    if (chatOrder !== order._id) {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id
            ? { ...o, unreadMessages: 0, hasUnreadMessages: false }
            : o
        )
      )

      fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id }),
      }).catch(() => {})

      setTimeout(() => {
        document
          .getElementById(`chat-${order._id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }}
  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
>
  <MessageCircle className="h-3 w-3" />

  {order.hasUnreadMessages && (
    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {order.unreadMessages}
    </span>
  )}

  {chatOrder === order._id ? 'Hide Chat' : 'Chat'}
</button>
                        {expandedOrder === order._id && orderFiles[order._id] && (
                          <div className="mt-2 space-y-1">
                            {orderFiles[order._id].length === 0 ? (
                              <p className="text-xs text-muted-foreground">No files attached</p>
                            ) : (
                              orderFiles[order._id].map((file) => (
                                <a
                                  key={file.id}
                                  href={`/api/files/download?id=${file.id}`}
                                  download={file.name}
                                  className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-950 rounded px-2 py-1"
                                >
                                  <FileText className="h-3 w-3" />
                                  {file.name}
                                  <Download className="h-3 w-3 ml-auto" />
                                </a>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      {/* Chat */}
                       {chatOrder === order._id && (
                        <div id={`chat-${order._id}`} className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground mb-3">Messages</p>
                          <OrderMessages orderId={order._id} userName="admin" />
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
     </>
      )}
      </div>
    </main>
  </>
  )
}
