'use client'
import { useEffect, useState, useMemo,useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent} from '@/components/ui/card'
import { showToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { OrderMessages } from '@/components/OrderMessages'
import { SoundNotification } from '@/components/SoundNotification'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { canAccessAdmin, isFounderRole, isModeratorRole } from '@/lib/roles'
import { Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { MessageSquare } from 'lucide-react'
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
  ExternalLink,
} from 'lucide-react'
import PremiumPageShell from '@/components/PremiumPageShell'
interface Order {
  _id: string
  studentEmail: string
  service: string
  requirements: string
  status: string
  price: number
  finalPrice?: number
  deliveryEstimate?: string
  priority?: string
  paymentStatus?: string
  cryptoPayments?: {
  txHash: string
  amount: number
  currency: string
  network: string
  type: 'deposit' | 'final'
  status: 'pending' | 'confirmed' | 'rejected'
  submittedAt: string
  confirmedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  verification?: {
  status: 'verified' | 'failed' | 'not_found'
  reason: string
  checkedAt: string
  receivedAmount?: number
  receiver?: string
  tokenSymbol?: string

}
}[]
  nowPayments?: {
  paymentId: string
  purchaseId?: string | null
  type: 'deposit' | 'final'
  amount: number
  currency: string
  payCurrency?: string
  status: string
  invoiceUrl?: string | null
  createdAt: string
  updatedAt?: string
  confirmedAt?: string
  actuallyPaid?: number | null
  payAmount?: number | null
}[]
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


const SERVICE_KEYS = [
  'graduation-projects',
  'academic-reports',
  'custom-websites',
  'mobile-apps',
  'powerpoint-presentations',
  'cv-resume-writing',
  'translation',
  'code-debugging',
  'ai-automation',
  'ui-ux-design',
] as const

type ServiceKey = typeof SERVICE_KEYS[number]

type TabType = 'orders' | 'users' | 'completed' | 'ratings' | 'crypto'
type StatusFilter = 'all' | 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'fully_paid'
type ServiceFilter = 'all' | ServiceKey
type SortOrder = 'newest' | 'oldest'


const STATUS_KEYS = [
  'all',
  'pending',
  'in-progress',
  'completed',
  'cancelled',
  'fully_paid',
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
type CryptoPaymentWithOrder = {
  source?: 'manual' | 'nowpayments'
  id?: string
  rawStatus?: string
  displayStatus?: string
  txHash: string | null
  invoiceUrl?: string | null
  paymentId?: string | null
  amount: number
  currency: string
  network?: string
  type: 'deposit' | 'final'
  status: string
  submittedAt: string
  confirmedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  verification?: {
    status: 'verified' | 'failed' | 'not_found'
    reason: string
    checkedAt: string
    receivedAmount?: number
    receiver?: string
    tokenSymbol?: string
  }
  orderId: string
  studentEmail: string
  service: string
  assignedTo?: string
  assignedToName?: string
}
export default function AdminPage() {
const t = useTranslations('Admin')

const getServiceName = useMemo(() => {
  return (service: string) => {
  const services: Record<string, string> = {
    'graduation-projects': t('services.graduationProjects'),
    'academic-reports': t('services.academicReports'),
    'custom-websites': t('services.customWebsites'),
    'mobile-apps': t('services.mobileApps'),
    'powerpoint-presentations': t('services.powerpoint'),
    'cv-resume-writing': t('services.cv'),
    translation: t('services.translation'),
    'code-debugging': t('services.debugging'),
    'ai-automation': t('services.ai'),
    'ui-ux-design': t('services.uiux'),
  }

  return services[service] || service
 }
}, [t])
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: t('status.pending'),
    'in-progress': t('status.inProgress'),
    completed: t('status.completed'),
    cancelled: t('status.cancelled'),
    fully_paid: t('status.fullyPaid'),
    confirmed: t('cryptoModal.confirmedShort'),
    rejected: t('cryptoModal.rejectedShort'),
  }

  return labels[status] || status
}
const SERVICE_OPTIONS = [
  { value: 'all', label: t('filters.allServices') },
  ...SERVICE_KEYS.map((value) => ({
    value,
    label: getServiceName(value),
  })),
] as const
const STATUS_OPTIONS = STATUS_KEYS.map((value) => ({
  value,
  label: t(`filters.status.${value}`),
})) as {
  value: StatusFilter
  label: string
}[]
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
  const [settingTimeline, setSettingTimeline] = useState<string | null>(null)
  const [timelineInput, setTimelineInput] = useState('')
  const [savingTimeline, setSavingTimeline] = useState(false)
  const [reassigningId, setReassigningId] = useState<string | null>(null)
  const [reassignModal, setReassignModal] = useState<{ open: boolean; orderId: string; currentName: string }>({ open: false, orderId: '', currentName: '' })
  const [moderatorStats, setModeratorStats] = useState<ModeratorStat[]>([])
  const router = useRouter()
  const knownOrderIdsRef = useRef<Set<string>>(new Set())
  const initializedOrdersRef = useRef(false)
  const previousUnreadTotalRef = useRef(0)
  const handledChatParamRef = useRef(false)
  const [userRole, setUserRole] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [streamConnected, setStreamConnected] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ratings, setRatings] = useState<Record<string, any>>({})
  const [reviewingCrypto, setReviewingCrypto] = useState<string | null>(null)
  const [recheckingCrypto, setRecheckingCrypto] = useState<string | null>(null)
  const [cryptoSearch, setCryptoSearch] = useState('')
  const [cryptoStatusFilter, setCryptoStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'rejected'>('all')
  const [cryptoSourceFilter, setCryptoSourceFilter] = useState<'all' | 'manual' | 'nowpayments'>('all')
  const [cryptoTypeFilter, setCryptoTypeFilter] = useState<'all' | 'deposit' | 'final'>('all')
  const [selectedCryptoPayment, setSelectedCryptoPayment] = useState<CryptoPaymentWithOrder | null>(null)
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
        showToast(t('toasts.orderReassigned', { name: newModName }), 'success')
        setReassignModal({ open: false, orderId: '', currentName: '' })
        fetchOrders()
      } else {
        showToast(data.error || t('toasts.failedReassign'), 'error')
      }
    } catch {
      showToast(t('toasts.failedReassign'), 'error')
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
        showToast(t('toasts.orderAccepted'), 'success')
        fetchOrders()
      } else {
        showToast(data.error || t('toasts.failedAccept'), 'error')
      }
    } catch {
      showToast(t('toasts.failedAccept'), 'error')
    }
    setAcceptingId(null)
  }

  const setFinalPrice = async (orderId: string) => {
    const price = parseFloat(priceInput)
    if (!price || price <= 0) {
      showToast(t('toasts.validPrice'), 'error')
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
        showToast(t('toasts.priceSet', { price, deposit }), 'success')
      }
    } catch {
      showToast(t('toasts.failedSetPrice'), 'error')
    }
    setSavingPrice(false)
  }

 const setDeliveryTimeline = async (orderId: string) => {
  const timeline = timelineInput.trim()

  if (!timeline || timeline.length < 3) {
    showToast(t('toasts.validTimeline'), 'error')
    return
  }

  setSavingTimeline(true)

  try {
    const res = await fetch('/api/orders/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        deliveryEstimate: timeline,
      }),
    })

    const data = await res.json()

    if (data.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, deliveryEstimate: timeline } : o
        )
      )

      setSettingTimeline(null)
      setTimelineInput('')
      showToast(t('toasts.timelineUpdated'), 'success')
    } else {
      showToast(data.error || t('toasts.failedTimeline'), 'error')
    }
  } catch {
    showToast(t('toasts.failedTimeline'), 'error')
  }

  setSavingTimeline(false)
} 
const reviewCryptoPayment = async (
  orderId: string,
  txHash: string,
  action: 'confirm' | 'reject'
) => {
  setReviewingCrypto(`${orderId}-${txHash}-${action}`)

  try {
    const res = await fetch('/api/crypto/admin-review', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, txHash, action }),
    })

    const data = await res.json()
    if (data.success) {
      showToast(
        action === 'confirm'
          ? t('toasts.cryptoConfirmed')
          : t('toasts.cryptoRejected'),
        'success'
      )
      fetchOrders()
    } else {
      showToast(data.error || t('toasts.failedReviewPayment'), 'error')
    }
  } catch {
    showToast(t('toasts.failedReviewPayment'), 'error')
  }

  setReviewingCrypto(null)
}
const recheckCryptoPayment = async (orderId: string, txHash: string) => {
  setRecheckingCrypto(`${orderId}-${txHash}`)

  try {
    const res = await fetch('/api/crypto/recheck-payment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, txHash }),
    })

    const data = await res.json()

    if (data.success) {
      showToast(t('toasts.blockchainUpdated'), 'success')
      fetchOrders()
    } else {
      showToast(data.error || t('toasts.failedRecheck'), 'error')
    }
  } catch {
    showToast(t('toasts.failedRecheck'), 'error')
  }

  setRecheckingCrypto(null)
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
        showToast(t('toasts.noteSaved'), 'success')
      }
    } catch {
      showToast(t('toasts.failedSaveNote'), 'error')
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
  showToast(t('toasts.newOrder'), 'success')
}

knownOrderIdsRef.current = nextOrderIds
initializedOrdersRef.current = true
  if (!chatOrder && unreadTotal > previousUnreadTotalRef.current) {
    const audio = new Audio('/chat.mp3')
    audio.play().catch(() => {})
    showToast(t('toasts.newChat'), 'success')
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
        showToast(currentBlocked ? t('toasts.userUnblocked') : t('toasts.userBlocked'), 'success')
        fetchUsers()
      }
    } catch {
      showToast(t('toasts.failedUpdateUser'), 'error')
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
        showToast(newRole === 'moderator'
        ? t('toasts.userNowModerator')
        : t('toasts.moderatorRemoved'), 'success')
        fetchUsers()
      } else {
        showToast(data.error || t('toasts.failedUpdateRole'), 'error')
      }
    } catch {
      showToast(t('toasts.failedUpdateRole'), 'error')
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

// Auto-open chat from notification/email link once after orders load
useEffect(() => {
  if (handledChatParamRef.current) return
  if (!authenticated) return
  if (orders.length === 0) return

  const params = new URLSearchParams(window.location.search)
  const chatId = params.get('chat')

  if (!chatId) return

  const orderExists = orders.some((order) => order._id === chatId)

  if (!orderExists) return

  handledChatParamRef.current = true

  window.setTimeout(() => {
    setActiveTab('orders')
    setSearchQuery('')
    setStatusFilter('all')
    setServiceFilter('all')
    setChatOrder(chatId)

    fetch('/api/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: chatId }),
    }).catch(() => {})

    window.setTimeout(() => {
      document
        .getElementById(`chat-${chatId}`)
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
    }, 500)
  }, 0)
}, [authenticated, orders])




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
          'in-progress': t('toasts.markedInProgress'),
          'completed': t('toasts.markedCompleted'),
        }
        showToast(labels[newStatus] || t('toasts.statusUpdated', { status: newStatus }), 'success')
      } else {
        showToast(data.error || t('toasts.failedUpdateOrder'), 'error')
      }
    } catch {
      showToast(t('toasts.failedUpdateOrder'), 'error')
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
        showToast(t('toasts.orderDeleted'), 'success')
      } else {
       
        showToast(data.error || t('toasts.failedDeleteOrder'), 'error')
      }
    } catch  {
     
      showToast(t('toasts.failedDeleteOrder'), 'error')
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
    
    if (diffMin < 5) return <span className="flex items-center gap-1 text-xs text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />{t('system.online')}</span>
    if (diffMin < 60) return <span className="text-xs text-muted-foreground">
  {t('time.minutesAgo', { count: diffMin })}
</span>
    const diffHrs = Math.floor(diffMin / 60)
    if (diffHrs < 24) return <span className="text-xs text-muted-foreground">
  {t('time.hoursAgo', { count: diffHrs })}
</span>
    const diffDays = Math.floor(diffHrs / 24)
    return <span className="text-xs text-muted-foreground">
  {t('time.daysAgo', { count: diffDays })}
</span>
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
    'graduation-projects': { min: 250, max: 1200 },
    'academic-reports': { min: 40, max: 250 },
    'custom-websites': { min: 500, max: 3000 },
    'mobile-apps': { min: 1000, max: 8000 },
    'powerpoint-presentations': { min: 40, max: 300 },
    'cv-resume-writing': { min: 30, max: 120 },
    'translation': { min: 15, max: 200 },
    'code-debugging': { min: 50, max: 500 },
    'ai-automation': { min: 300, max: 5000 },
    'ui-ux-design': { min: 150, max: 1500 },
  }

  return ranges[service] || { min: 0, max: 0 }
}

const cryptoPayments = useMemo(() => {
  return orders
    .filter((order) => {
      if (isModeratorRole(userRole)) {
        return order.assignedTo === currentUserId
      }

      return true
    })
    .flatMap((order) => {
      const manualPayments = (order.cryptoPayments || []).map((payment) => ({
        source: 'manual' as const,
        id: payment.txHash,
        rawStatus: payment.status,
        displayStatus: payment.status,
        status: payment.status,
        txHash: payment.txHash,
        network: payment.network,
        invoiceUrl: null,
        paymentId: null,
        amount: payment.amount,
        currency: payment.currency,
        type: payment.type,
        submittedAt: payment.submittedAt,
        confirmedAt: payment.confirmedAt,
        reviewedAt: payment.reviewedAt,
        reviewedBy: payment.reviewedBy,
        verification: payment.verification,
        orderId: order._id,
        studentEmail: order.studentEmail,
        service: order.service,
        assignedTo: order.assignedTo,
        assignedToName: order.assignedToName,
      }))

      const nowPayments = (order.nowPayments || []).map((payment) => {
        const rawStatus = payment.status || 'waiting'

        const displayStatus =
          ['finished', 'confirmed', 'sending'].includes(rawStatus)
            ? 'confirmed'
            : ['failed', 'refunded', 'expired'].includes(rawStatus)
              ? 'rejected'
              : 'pending'

        return {
          source: 'nowpayments' as const,
          id: payment.paymentId,
          rawStatus,
          displayStatus,
          status: displayStatus,
          txHash: null,
          network: payment.payCurrency || 'NOWPayments',
          invoiceUrl: payment.invoiceUrl || null,
          paymentId: payment.paymentId,
          amount: payment.amount,
          currency: payment.currency || 'USD',
          type: payment.type,
          submittedAt: payment.createdAt,
          confirmedAt: payment.confirmedAt,
          reviewedAt: undefined,
          reviewedBy: 'NOWPayments',
          verification: undefined,
          orderId: order._id,
          studentEmail: order.studentEmail,
          service: order.service,
          assignedTo: order.assignedTo,
          assignedToName: order.assignedToName,
        }
      })

      return [...manualPayments, ...nowPayments]
    })
    .filter((payment) => {
      const query = cryptoSearch.toLowerCase().trim()

      const matchesSearch =
        !query ||
        payment.studentEmail.toLowerCase().includes(query) ||
        payment.orderId.toLowerCase().includes(query) ||
        payment.id.toLowerCase().includes(query) ||
        (payment.txHash || '').toLowerCase().includes(query) ||
        (payment.paymentId || '').toLowerCase().includes(query) ||
        getServiceName(payment.service)
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        cryptoStatusFilter === 'all' || payment.displayStatus === cryptoStatusFilter

      const matchesType =
        cryptoTypeFilter === 'all' || payment.type === cryptoTypeFilter

      const matchesSource =
        cryptoSourceFilter === 'all' || payment.source === cryptoSourceFilter

      return matchesSearch && matchesStatus && matchesType && matchesSource
    })
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() -
        new Date(a.submittedAt).getTime()
    )
}, [
  orders,
  cryptoSearch,
  cryptoStatusFilter,
  cryptoTypeFilter,
  cryptoSourceFilter,
  userRole,
  currentUserId,
  getServiceName,
])



const cryptoStats = useMemo(() => {
  const allPayments = orders.flatMap((order) =>
    (order.cryptoPayments || []).map((payment) => ({
      ...payment,
      assignedTo: order.assignedTo,
    }))
  )

  const visibleConfirmed = cryptoPayments.filter(
    (payment) => payment.status === 'confirmed'
  )

  const visiblePending = cryptoPayments.filter(
    (payment) => payment.status === 'pending'
  )

  const visibleRejected = cryptoPayments.filter(
    (payment) => payment.status === 'rejected'
  )

  const founderOwnConfirmed = allPayments.filter(
    (payment) =>
      payment.status === 'confirmed' &&
      payment.assignedTo === currentUserId
  )

  const siteConfirmed = allPayments.filter(
    (payment) => payment.status === 'confirmed'
  )

  return {
    visibleRevenue: visibleConfirmed.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    ),
    pendingAmount: visiblePending.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    ),
    confirmedCount: visibleConfirmed.length,
    rejectedCount: visibleRejected.length,
    founderOwnRevenue: founderOwnConfirmed.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    ),
    siteRevenue: siteConfirmed.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    ),
  }
}, [orders, cryptoPayments, currentUserId])

const getVerificationBadge = (
  verification?: CryptoPaymentWithOrder['verification']
) => {
  if (!verification) {
    return {
      label: t('verification.notChecked'),
      className: 'bg-muted text-muted-foreground',
    }
  }

  if (verification.status === 'verified') {
    return {
     label: t('verification.verifiedTron'),
      className: 'bg-emerald-500/10 text-emerald-600',
    }
  }

  if (verification.status === 'failed') {
    return {
      label: t('verification.failed'),
      className: 'bg-red-500/10 text-red-600',
    }
  }

  return {
    label: t('verification.notFoundYet'),
    className: 'bg-amber-500/10 text-amber-600',
  }
}
if (loading) {
  return null
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
            <h3 className="text-lg font-semibold mb-2">{t('reassign.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('reassign.currentlyAssigned')} <strong>{reassignModal.currentName}</strong>
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
              {t('system.cancel')}
            </Button>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={deleteModal.open}
        title={t('deleteModal.title')}
        message={t('deleteModal.message')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, orderId: '' })}
      />
      <SoundNotification play={playSound} />
      <PremiumPageShell className="pt-20 py-8 px-4">
{selectedCryptoPayment && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <div className="w-full max-w-2xl rounded-3xl border border-border/60 bg-background p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-foreground">
            {t('cryptoModal.title')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {getServiceName(selectedCryptoPayment.service)}
          </p>
        </div>

        <button
          onClick={() => setSelectedCryptoPayment(null)}
          className="rounded-xl p-2 hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">{t('cryptoModal.status')}</p>
          <p className="mt-1 font-bold text-foreground">{getStatusLabel(selectedCryptoPayment.status)}</p>
        </div>

        <div className="rounded-2xl bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">{t('cryptoModal.amount')}</p>
          <p className="mt-1 font-bold text-green-600">
            {selectedCryptoPayment.amount} {selectedCryptoPayment.currency}
          </p>
        </div>

        <div className="rounded-2xl bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">{t('cryptoModal.network')}</p>
          <p className="mt-1 font-bold text-foreground">{selectedCryptoPayment.network}</p>
        </div>

        <div className="rounded-2xl bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">{t('cryptoModal.type')}</p>
          <p className="mt-1 font-bold text-foreground">
            {selectedCryptoPayment.type === 'deposit'
            ? t('cryptoModal.deposit')
              : t('cryptoModal.finalPayment')}
          </p>
        </div>

        <div className="rounded-2xl bg-muted/40 p-4 sm:col-span-2">
          <p className="text-xs text-muted-foreground">{t('cryptoModal.orderId')}</p>
          <p className="mt-1 break-all font-mono text-xs text-foreground">
            {selectedCryptoPayment.orderId}
          </p>
        </div>

        <div className="rounded-2xl bg-muted/40 p-4 sm:col-span-2">
         <p className="text-xs text-muted-foreground">{t('cryptoModal.txHash')}</p>
          <p className="mt-1 break-all font-mono text-xs text-foreground">
            {selectedCryptoPayment.txHash}
          </p>
        </div>
<div className="rounded-2xl bg-muted/40 p-4 sm:col-span-2">
  <p className="text-xs text-muted-foreground">{t('cryptoModal.verification')}</p>

  <div
    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
      getVerificationBadge(selectedCryptoPayment.verification).className
    }`}
  >
    {getVerificationBadge(selectedCryptoPayment.verification).label}
  </div>

  <p className="mt-2 text-sm text-foreground">
    {selectedCryptoPayment.verification?.reason || t('cryptoModal.notChecked')}
  </p>

  {selectedCryptoPayment.verification?.receivedAmount && (
    <p className="mt-2 text-xs text-muted-foreground">
      {t('cryptoModal.received')}: {selectedCryptoPayment.verification.receivedAmount}{' '}
      {selectedCryptoPayment.verification.tokenSymbol || 'USDT'}
    </p>
  )}

  {selectedCryptoPayment.verification?.receiver && (
    <p className="mt-2 break-all text-xs text-muted-foreground">
      {t('cryptoModal.receiver')}: {selectedCryptoPayment.verification.receiver}
    </p>
  )}

  {selectedCryptoPayment.verification?.checkedAt && (
    <p className="mt-2 text-xs text-muted-foreground">
      {t('cryptoModal.checkedAt')}:{' '}
      {new Date(selectedCryptoPayment.verification.checkedAt).toLocaleString()}
    </p>
  )}
</div>
        <div className="rounded-2xl bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">{t('cryptoModal.submittedAt')}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {new Date(selectedCryptoPayment.submittedAt).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">{t('cryptoModal.confirmedAt')}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {selectedCryptoPayment.confirmedAt
              ? new Date(selectedCryptoPayment.confirmedAt).toLocaleString()
              : t('cryptoModal.notConfirmed')}
          </p>
        </div>

        <div className="rounded-2xl bg-muted/40 p-4 sm:col-span-2">
          <p className="text-xs text-muted-foreground">{t('cryptoModal.reviewedBy')}</p>
          <p className="mt-1 break-all text-sm font-semibold text-foreground">
           {selectedCryptoPayment.reviewedBy || t('cryptoModal.notReviewed')}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 p-4">
        <h4 className="mb-4 text-sm font-bold text-foreground">{t('cryptoModal.timeline')}</h4>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="mt-1 h-3 w-3 rounded-full bg-blue-500" />
            <div>
              <p className="text-sm font-semibold text-foreground">{t('cryptoModal.submitted')}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(selectedCryptoPayment.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {selectedCryptoPayment.status === 'confirmed' && (
            <div className="flex gap-3">
              <div className="mt-1 h-3 w-3 rounded-full bg-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-foreground">{t('cryptoModal.confirmed')}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCryptoPayment.confirmedAt
                    ? new Date(selectedCryptoPayment.confirmedAt).toLocaleString()
                    : t('cryptoModal.confirmedShort')}
                </p>
              </div>
            </div>
          )}

          {selectedCryptoPayment.status === 'rejected' && (
            <div className="flex gap-3">
              <div className="mt-1 h-3 w-3 rounded-full bg-red-500" />
              <div>
                <p className="text-sm font-semibold text-foreground">{t('cryptoModal.rejected')}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCryptoPayment.reviewedAt
                    ? new Date(selectedCryptoPayment.reviewedAt).toLocaleString()
                    : t('cryptoModal.rejectedShort')}
                </p>
              </div>
            </div>
          )}

          {selectedCryptoPayment.status === 'pending' && (
            <div className="flex gap-3">
              <div className="mt-1 h-3 w-3 rounded-full bg-amber-500" />
              <div>
                <p className="text-sm font-semibold text-foreground">{t('cryptoModal.waiting')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('cryptoModal.waitingDescription')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}

      <div className="max-w-7xl mx-auto">
       <div className="mb-10 space-y-6">

        <div>
  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
    <Shield className="h-3.5 w-3.5" />
   {isFounderRole(userRole)
  ? t('dashboard.founderAccess')
  : t('dashboard.staffAccess')}
  </div>

  <h1 className="text-4xl font-black tracking-tight text-foreground">
  {isFounderRole(userRole)
  ? t('dashboard.founder')
  : t('dashboard.staff')}
  </h1>

  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
    {t('dashboard.description')}
  </p>
</div>

<div className="flex flex-wrap items-center gap-2">
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
    {streamConnected ? t('system.liveSync') : t('system.offline')}
  </div>

  {userRole === 'founder' && (
    <>
      <Link href="/admin/audit-logs">
        <Button variant="outline" size="default">
          <Shield className="h-4 w-4 mr-1" />
          {t('buttons.auditLogs')}
        </Button>
      </Link>

      <Link href="/admin/feedback">
        <Button variant="outline" size="default">
          <MessageSquare className="h-4 w-4 mr-1" />
          {t('buttons.feedbackInbox')}
        </Button>
      </Link>
    </>
  )}

  {canAccessAdmin(userRole) && (
    <Link href="/profile">
      <Button variant="outline" size="default">
        <User className="h-4 w-4 mr-1" />
        {t('buttons.profile')}
      </Button>
    </Link>
  )}

  <Button variant="outline" size="default" onClick={fetchOrders}>
    <RefreshCw className="h-4 w-4 mr-1" />
    {t('buttons.refresh')}
  </Button>

  <Button variant="outline" size="default" onClick={handleLogout}>
    <LogOut className="h-4 w-4 mr-1" />
    {t('buttons.logout')}
  </Button>
</div>

        </div>
    <div className="mb-8 flex flex-wrap gap-3">
        <button
  onClick={() => {
    setActiveTab('orders')
    fetchOrders()
    if (isFounderRole(userRole)) fetchUsers()
  }}
  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
    activeTab === 'orders' ? 'bg-blue-600 text-white' : 'border border-border/60 bg-white/45 dark:bg-black/35 backdrop-blur-xl text-muted-foreground hover:border-blue-500/30 hover:text-foreground'
  }`}
>
📦 {t('tabs.orders')}
  {stats.pending > 0 && (
    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
      {stats.pending} {t('status.pending')}
    </span>
  )}
</button>
<button
  onClick={() => setActiveTab('crypto')}
  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
    activeTab === 'crypto'
      ? 'bg-emerald-600 text-white'
      : 'border border-border/60 bg-white/45 dark:bg-black/35 backdrop-blur-xl text-muted-foreground hover:border-emerald-500/30 hover:text-foreground'
  }`}
>
  💳 {t('tabs.crypto')}
</button>
          {/* Completed tab - only for moderators */}
          {isModeratorRole(userRole) && (
            <button
             onClick={() => {
  setActiveTab('completed' as TabType)
  fetchRatings()
}}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'completed' ? 'bg-green-600 text-white' : 'border border-border/60 bg-white/45 dark:bg-black/35 backdrop-blur-xl text-muted-foreground hover:border-blue-500/30 hover:text-foreground'
              }`}
            >
              ✅ {t('tabs.completed')}
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
                activeTab === 'ratings' ? 'bg-yellow-600 text-white' : 'border border-border/60 bg-white/45 dark:bg-black/35 backdrop-blur-xl text-muted-foreground hover:border-blue-500/30 hover:text-foreground'
              }`}
            >
              ⭐ {t('tabs.ratings')}
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
        activeTab === 'users' ? 'bg-blue-600 text-white' : 'border border-border/60 bg-white/45 dark:bg-black/35 backdrop-blur-xl text-muted-foreground hover:border-blue-500/30 hover:text-foreground'
         }`}
         >  
         👥 {t('tabs.users')}
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
                  <p className="text-xs text-muted-foreground">
                   {t('stats.totalUsers')}
                    </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{users.filter(u => !u.blocked).length}</p>
                  <p className="text-xs text-muted-foreground">
                 {t('stats.activeUsers')}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-500">{users.filter(u => u.blocked).length}</p>
                  <p className="text-xs text-muted-foreground">
                   {t('stats.blockedUsers')}
                  </p>
                </CardContent>
              </Card>
            </div>

          
            {/* Moderator Performance - Only visible to Founder */}
            {isFounderRole(userRole) && moderatorStats.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                 🏆 {t('users.moderatorPerformance')}
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
                            <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">⭐ {t('users.top')}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-blue-600">{mod.stats.totalAssigned}</p>
                            <p className="text-[10px] text-muted-foreground">{t('users.assigned')}</p>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-yellow-600">{mod.stats.inProgress}</p>
                            <p className="text-[10px] text-muted-foreground">{t('users.inProgress')}</p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-green-600">{mod.stats.completed}</p>
                            <p className="text-[10px] text-muted-foreground">{t('users.completed')}</p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-red-500">{mod.stats.cancelled}</p>
                            <p className="text-[10px] text-muted-foreground">{t('users.cancelled')}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{t('users.completionRate')}</span>
                            <span className="text-sm font-bold text-green-600">{mod.stats.completionRate}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
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
                <h2 className="text-lg font-semibold text-foreground mt-6">{t('users.allUsers')}</h2>
             {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <input
                type="text"
                placeholder={t('filters.searchUsers')}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
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




<Card
  key={u._id}
  className={`overflow-hidden border border-border/60 bg-card shadow-sm transition-all hover:border-blue-500/30 hover:shadow-lg ${
    u.blocked ? 'opacity-60' : ''
  }`}
>
             <CardContent className="p-0">
  <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-center gap-4">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold ${
          u.blocked
            ? 'bg-red-500/10 text-red-500'
            : u.role === 'moderator'
              ? 'bg-purple-500/10 text-purple-500'
              : 'bg-blue-500/10 text-blue-500'
        }`}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(u as any).profilePic ? (
          
          <Image
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            src={(u as any).profilePic}
            alt={u.name}
            width={56}
            height={56}
            className="h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          u.name.charAt(0).toUpperCase()
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/profile?id=${u._id}`}
            className="truncate text-base font-bold text-foreground hover:text-blue-600 hover:underline"
          >
            {u.name}
          </Link>

          {u.role === 'moderator' && (
            <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-500">
             {t('users.moderator')}
            </span>
          )}

          {u.blocked && (
            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">
             {t('users.blocked')}
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-sm text-muted-foreground">
          {u.email}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            {t('system.joined')} {new Date(u.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>

          {u.role === 'moderator' && getLastSeenText(u.lastSeen)}
        </div>
      </div>
    </div>

    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          setRole(
            u._id,
            u.email,
            u.role === 'moderator' ? 'student' : 'moderator'
          )
        }
        className="border-purple-500/20 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 dark:text-purple-700 dark:text-purple-300"
      >
        {u.role === 'moderator' ? t('users.removeMod') : t('users.makeMod')}
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => toggleBlockUser(u._id, !!u.blocked)}
        className={
          u.blocked
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-700 dark:text-emerald-300'
            : 'border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-300'
        }
      >
        {u.blocked ? t('users.unblock') : t('users.block')}
      </Button>
    </div>
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
      ⭐ {t('ratings.title')}
    </h2>
    {orders.filter(o => o.status === 'completed').length === 0 ? (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">{t('ratings.noCompleted')}</p>
        </CardContent>
      </Card>
    ) : (
      orders.filter(o => o.status === 'completed').map((order) => (
        <Card key={order._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
         <CardContent className="p-0">
         <div className="border-b border-border/50 bg-gradient-to-r from-yellow-500/[0.03] via-transparent to-blue-500/[0.03] px-6 py-5">
         <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-foreground text-lg">
                    {getServiceName(order.service)}
                  </p>
                  {/* Payment Status Badge */}
                  {order.paymentStatus === 'fully_paid' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300">
                     💚 {t('ratings.fullyPaid')}
                    </span>
                  ) : order.paymentStatus === 'deposit_paid' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">
                      💙 {t('ratings.depositPaid')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                     ✅ {t('ratings.completed')}
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
                      {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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
                      <span className="text-xs text-muted-foreground">{t('ratings.deposit')}: ${order.depositAmount}</span>
                    </div>
                  )}
                </div>
                
                {/* Moderator info */}
                {order.assignedToName && (
                  <div className="flex items-center gap-1 mt-1">
                    <User className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-muted-foreground">
                      {t('ratings.moderator')}: {order.assignedToName}
                    </p>
                  </div>
                )}
                
                {/* Requirements preview */}
                {order.requirements && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">{t('ratings.requirements')}:</p>
                    <p className="text-xs text-foreground bg-muted rounded p-2 mt-1 line-clamp-2">
                      {order.requirements.substring(0, 150)}{order.requirements.length > 150 ? '...' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
           </div>

            {/* Rating Section */}
             <div className="px-6 py-5">
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
                  <span className="text-xs text-muted-foreground italic">{t('ratings.noRating')}</span>
                </div>
              )}
            </div>
            
            {/* Files and Chat Buttons */}
          <div className="border-t border-border/50 px-6 py-4">
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
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
}, 300)
    }
  }}
 className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-500/20 dark:text-blue-700 dark:text-blue-300"
>
  <MessageCircle className="h-3 w-3" />

  {order.hasUnreadMessages && (
    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {order.unreadMessages}
    </span>
  )}

  {chatOrder === order._id
  ? t('ratings.hideChat')
  : t('ratings.chat')}
</button>
              </div>
              
              {/* Files List */}
              {expandedOrder === order._id && orderFiles[order._id] && (
                <div className="mt-3 space-y-1">
                  {orderFiles[order._id].length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('ratings.noFiles')}</p>
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
               <div
  id={`chat-${order._id}`}
  className="scroll-mt-24 mt-4 pt-4 border-t"
>
                  <p className="scroll-mt-24 text-xs text-muted-foreground mb-3">{t('ratings.messages')}</p>
                 <OrderMessages orderId={order._id} userName="admin" />
                </div>
              )}
            </div>
            
            {/* Delete button for founder */}
           <div className="flex justify-end border-t border-border/50 px-6 py-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteOrder(order._id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
               {t('orders.deleteOrder')}
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
               <Card
               key={order._id}
               className="overflow-hidden border border-border/60 bg-card shadow-sm transition-all hover:border-yellow-500/30 hover:shadow-lg"
                  >
                 <CardContent className="p-6">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div>
                       <p className="font-semibold text-foreground">{getServiceName(order.service)}</p>
                       <div className="flex items-center gap-2 mt-1">
                         <Mail className="h-3 w-3 text-gray-400" />
                         <p className="text-sm text-muted-foreground">{order.studentEmail}</p>
                       </div>
                       <div className="flex items-center gap-4 mt-1">
                         <p className="text-xs text-muted-foreground">
                           {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                         </p>
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                           <CheckCircle2 className="h-3 w-3" />
                           completed
                         </span>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="font-bold text-green-600 text-lg">
                        ${order.finalPrice || order.price}
                        </p>
                        
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
{activeTab === 'crypto' && (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold text-foreground">
      💳 {t('crypto.title')}
    </h2>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
  {[

   {
label: isFounderRole(userRole)
  ? t('crypto.myRevenue')
  : t('crypto.myCryptoRevenue'),
  value: `${isFounderRole(userRole) ? cryptoStats.founderOwnRevenue : cryptoStats.visibleRevenue} USDT`,
  icon: DollarSign,
  color: 'bg-emerald-500/10 text-emerald-500',
},
...(isFounderRole(userRole)
  ? [
      {
       label: t('crypto.siteRevenue'),
        value: `${cryptoStats.siteRevenue} USDT`,
        icon: DollarSign,
        color: 'bg-purple-500/10 text-purple-500',
      },
    ]
  : []),
    {
      label: t('crypto.pendingAmount'),
      value: `${cryptoStats.pendingAmount} USDT`,
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-500',
    },
    {
      label: t('crypto.confirmedPayments'),
      value: cryptoStats.confirmedCount,
      icon: CheckCircle2,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      label: t('crypto.rejectedPayments'),
      value: cryptoStats.rejectedCount,
      icon: XCircle,
      color: 'bg-red-500/10 text-red-500',
    },
  ].map((stat) => (
    <Card
      key={stat.label}
      className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition-all hover:border-emerald-500/30"
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.color}`}>
          <stat.icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <p className="text-xl font-black text-foreground">{stat.value}</p>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
<Card className="border border-border/60 bg-card shadow-sm">
  <CardContent className="p-4">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={cryptoSearch}
          onChange={(e) => setCryptoSearch(e.target.value)}
          placeholder={t('crypto.searchPlaceholder')}
          className="h-11 w-full rounded-xl border border-input bg-background/70 pl-10 pr-4 text-sm text-foreground outline-none focus:border-emerald-500"
        />
      </div>

      <select
        value={cryptoStatusFilter}
        onChange={(e) =>
          setCryptoStatusFilter(e.target.value as 'all' | 'confirmed' | 'pending' | 'rejected')
        }
        className="h-11 rounded-xl border border-input bg-background/70 px-4 text-sm text-foreground outline-none focus:border-emerald-500"
      >
<option value="all">{t('crypto.allStatuses')}</option>
<option value="confirmed">{t('crypto.confirmed')}</option>
<option value="pending">{t('crypto.pending')}</option>
<option value="rejected">{t('crypto.rejected')}</option>
      </select>
<select
  value={cryptoSourceFilter}
  onChange={(e) =>
    setCryptoSourceFilter(e.target.value as 'all' | 'manual' | 'nowpayments')
  }
  className="h-11 rounded-xl border border-input bg-background/70 px-4 text-sm text-foreground outline-none focus:border-emerald-500"
>
<option value="all">{t('crypto.allSources')}</option>
<option value="manual">{t('crypto.manualCrypto')}</option>
<option value="nowpayments">NOWPayments</option>
</select>
      <select
        value={cryptoTypeFilter}
        onChange={(e) =>
          setCryptoTypeFilter(e.target.value as 'all' | 'deposit' | 'final')
        }
        className="h-11 rounded-xl border border-input bg-background/70 px-4 text-sm text-foreground outline-none focus:border-emerald-500"
      >
  <option value="all">{t('crypto.allTypes')}</option>
<option value="deposit">{t('orders.deposit')}</option>
<option value="final">{t('orders.finalPayment')}</option>
      </select>

      {(cryptoSearch || cryptoStatusFilter !== 'all' || cryptoTypeFilter !== 'all' || cryptoSourceFilter !== 'all') && (
        <Button
          variant="outline"
          onClick={() => {
            setCryptoSourceFilter('all')
            setCryptoSearch('')
            setCryptoStatusFilter('all')
            setCryptoTypeFilter('all')
          }}
        >
         {t('system.clear')}
        </Button>
      )}
    </div>
  </CardContent>
</Card>

   {cryptoPayments.length === 0 ? (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center">
          <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
           {t('crypto.noPayments')}
          </p>
        </CardContent>
      </Card>
    ) : (


<div className="space-y-3">
  {cryptoPayments.map((payment) => (
    <Card
      key={`${payment.orderId}-${payment.source}-${payment.id}`}
  className="overflow-hidden border border-border/60 bg-card shadow-sm"
>
  <CardContent className="p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              payment.status === 'confirmed'
                ? 'bg-emerald-500/10 text-emerald-600'
                : payment.status === 'rejected'
                  ? 'bg-red-500/10 text-red-600'
                  : 'bg-amber-500/10 text-amber-600'
            }`}
          >
            {getStatusLabel(payment.status)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              payment.source === 'nowpayments'
                ? 'bg-blue-500/10 text-blue-500'
                : 'bg-green-500/10 text-green-500'
            }`}
          >
   {payment.source === 'nowpayments'
  ? 'NOWPayments'
  : t('crypto.manual')}
          </span>

          <span className="font-bold text-foreground">
           {payment.type === 'deposit'
            ? t('orders.deposit')
            : t('orders.finalPayment')}
          </span>

          <span className="font-bold text-green-600">
            {payment.amount} {payment.currency}
          </span>

          {payment.source !== 'nowpayments' && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                getVerificationBadge(payment.verification).className
              }`}
            >
              {getVerificationBadge(payment.verification).label}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {getServiceName(payment.service)} • {payment.studentEmail}
        </p>

        <p className="text-xs text-muted-foreground">
         {t('crypto.submitted')}: {new Date(payment.submittedAt).toLocaleString()}
        </p>

        {payment.source === 'nowpayments' ? (
          <div className="max-w-xl rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{t('crypto.paymentId')}</p>
            <p className="mt-1 break-all font-mono text-xs text-foreground">
              {payment.paymentId}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
             {t('crypto.gatewayStatus')}: {payment.rawStatus}
            </p>
          </div>
        ) : (
          <div className="flex max-w-xl items-center gap-2 rounded-xl bg-muted/40 p-3">
            <p className="flex-1 break-all font-mono text-xs text-foreground">
              {payment.txHash}
            </p>

            <button
              type="button"
              onClick={async () => {
                if (!payment.txHash) return
                await navigator.clipboard.writeText(payment.txHash)
                showToast(t('toasts.txCopied'), 'success')
              }}
              className="rounded-lg bg-background px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
             {t('system.copy')}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button
          size="sm"
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setSelectedCryptoPayment(payment)
          }}
          className="h-9 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
        >
        {t('crypto.paymentDetails')}
        </Button>

        {payment.source === 'nowpayments' ? (
          payment.invoiceUrl && (
            <a
              href={payment.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 text-xs font-semibold text-blue-600 hover:bg-blue-500/20 dark:text-blue-300"
            >
             {t('orders.openInvoice')}
              <ExternalLink className="h-3 w-3" />
            </a>
          )
        ) : (
          <>
            <Button
              size="sm"
              type="button"
              onClick={() => {
                if (!payment.txHash) return
                recheckCryptoPayment(payment.orderId, payment.txHash)
              }}
              disabled={recheckingCrypto === `${payment.orderId}-${payment.txHash}`}
              className="h-9 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 text-xs font-semibold text-amber-500 hover:bg-amber-500/20"
            >
              {recheckingCrypto === `${payment.orderId}-${payment.txHash}` ? t('crypto.checking') : t('crypto.recheck')}
            </Button>

            {payment.txHash && (
              <a
                href={`https://tronscan.org/#/transaction/${payment.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 text-xs font-semibold text-blue-600 hover:bg-blue-500/20 dark:text-blue-300"
              >
               {t('crypto.viewOnTronscan')}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </>
        )}
      </div>
    </div>
  </CardContent>
</Card>
  ))}







        
      </div>
    )}
  </div>
)}

       {activeTab === 'orders' && (
           <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 mb-10">
                   {[ 
            { label: t('stats.totalOrders'), value: stats.total, icon: Package, color: 'bg-slate-100 text-slate-700', valueColor: 'text-foreground' },
            { label: t('stats.pendingOrders'), value: stats.pending, icon: Clock, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', valueColor: 'text-yellow-700 dark:text-yellow-400' },
            { label: t('stats.inProgressOrders'), value: stats.inProgress, icon: FileText, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', valueColor: 'text-blue-700 dark:text-blue-400' },
            { label: t('stats.completedOrders'), value: stats.completed, icon: CheckCircle2, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', valueColor: 'text-green-700 dark:text-green-400' },
            { label: t('stats.cancelledOrders'), value: stats.cancelled, icon: XCircle, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', valueColor: 'text-red-700 dark:text-red-400' },
            ...(isFounderRole(userRole) ? [
              { label: t('stats.revenue'), value: `$${stats.totalRevenue}`, icon: DollarSign, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', valueColor: 'text-emerald-700 dark:text-emerald-400' }
            ] : []),
          ].map((stat) => (
            <Card key={stat.label} className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
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
     <Card className="mb-8 group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:border-blue-500/30">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                 placeholder={t('orders.searchPlaceholder')}
                  className="h-11 w-full rounded-xl border border-input bg-background/70 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

  <select
 className="h-11 rounded-xl border border-input bg-background/70 px-4 text-sm text-foreground outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
>
  {STATUS_OPTIONS.map(option => (
    <option key={option.value} value={option.value}>{option.label}</option>
  ))}
</select>
<select
  className="h-11 rounded-xl border border-input bg-background/70 px-4 text-sm text-foreground outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
  value={serviceFilter}
  onChange={(e) => setServiceFilter(e.target.value as ServiceFilter)}
>
  {SERVICE_OPTIONS.map(option => (
    <option key={option.value} value={option.value}>{option.label}</option>
  ))}
</select>


             <Button
  variant="outline"
  size="default"
 className="h-11 border-border bg-background/70 text-foreground hover:bg-muted"
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
               {sortOrder === 'newest' ? t('orders.newest') : t('orders.oldest')}
              </Button>
            </div>
            {(searchQuery || statusFilter !== 'all' || serviceFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setServiceFilter('all')
                }}
                className="mt-4 inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20"              >
                <X className="h-3 w-3" />
               {t('orders.clearFilters')}
              </button>
            )}
          </CardContent>
        </Card>

  {filteredOrders.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
             <p className="text-muted-foreground text-lg">
                   {t('orders.noOrdersFound')}
                       </p>
              <p className="text-muted-foreground text-sm">
               {orders.length === 0
              ? t('orders.empty')
               : t('orders.emptyFiltered')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('orders.showing', {
              count: filteredOrders.length,
              total: orders.length,
             })}
            </p>
    {filteredOrders.map((order) => (
  <Card
    key={order._id}
    className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none"  >
   <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_40%)]" />
    <CardContent className="p-0">
      {/* Top Header */}
      <div className="border-b border-border/50 bg-gradient-to-r from-blue-500/[0.03] via-background to-purple-500/[0.03] px-6 py-5 dark:border-white/10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          {/* Left */}
         <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-500/10 p-2.5">
                <Mail className="h-4 w-4 text-blue-400" />
              </div>

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('orders.client')}
                </p>

               <p className="truncate text-sm font-semibold text-foreground dark:text-white">
                  {order.studentEmail}
                </p>
              </div>
            </div>

            {/* Service */}
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-purple-500/10 p-2.5">
                <Package className="h-4 w-4 text-purple-400" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('orders.service')}
                </p>

              <p className="text-sm font-semibold text-foreground dark:text-white">
                  {getServiceName(order.service)}
                </p>

                {!order.finalPrice &&
                  (order.status === 'pending' ||
                    order.status === 'in-progress') && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      ${getServiceRange(order.service).min} - $
                      {getServiceRange(order.service).max}
                    </p>
                  )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('orders.price')}
                </p>

                <p className="text-lg font-bold text-emerald-400">
                  {order.finalPrice
                    ? `$${order.finalPrice}`
                    : `$${order.price}`}
                </p>

                {order.finalPrice && order.depositAmount && (
                  <p className="text-xs text-muted-foreground">
                   {t('orders.deposit')}: ${order.depositAmount}
                  </p>
                )}
              </div>
            </div>

         
<div className="flex items-start gap-3">
{/* Timeline */}
<div className="flex items-center gap-3 min-w-[140px]">
  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
    <Clock className="h-4 w-4 text-cyan-400" />
  </div>

  <div className="leading-tight">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
     {t('orders.timeline')}
    </p>

    <p className="text-sm font-bold text-cyan-400">
      {order.deliveryEstimate || t('orders.notSet')}
    </p>
  </div>
</div>

{/* Created */}
<div className="flex items-center gap-3 min-w-[140px]">
  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
    <Calendar className="h-4 w-4 text-orange-400" />
  </div>
  <div className="leading-tight">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
      {t('orders.created')}
    </p>

    <p className="text-sm font-bold text-foreground">

      {new Date(order.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}
    </p>
  </div>
</div>
            </div>
          </div>

          {/* Right Status Area */}
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${getStatusColor(
                order.status
              )}`}
            >
             {getStatusIcon(order.status)}
           {getStatusLabel(order.status)}
            </span>
<span
  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
    !order.paymentStatus || order.paymentStatus === 'unpaid'
      ? 'border-red-500/20 bg-red-500/10 text-red-500'
      : order.paymentStatus === 'deposit_paid'
        ? 'border-blue-500/20 bg-blue-500/10 text-blue-500'
        : order.paymentStatus === 'fully_paid'
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
          : 'border-amber-500/20 bg-amber-500/10 text-amber-500'
  }`}
>
  {!order.paymentStatus || order.paymentStatus === 'unpaid'
    ? <>💸 {t('orders.unpaid')}</>
    : order.paymentStatus === 'deposit_paid'
      ? <>💙 {t('orders.depositPaid')}</>
      : order.paymentStatus === 'fully_paid'
        ?<>✅ {t('orders.fullyPaid')}</>
        : <>⏳ {t('orders.payment')}</>}
              </span>
            {order.paymentStatus === 'unpaid' && order.finalPrice && (
              <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                {t('orders.awaitingDeposit')}
              </span>
            )}
            {order.priority === 'urgent' && (
              <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-400">
                🔥 {t('orders.urgent')}
              </span>
            )}

            {order.priority === 'normal' && (
              <span className="rounded-full bg-orange-500/10 px-2 py-1 text-xs font-semibold text-orange-700 dark:text-orange-300">
                🔥 {t('orders.normal')}
              </span>
            )}

            {order.priority === 'low' && (
              <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-1 text-xs font-semibold text-foreground">
               {t('orders.low')}
              </span>
            )}

            {order.assignedToName && (
              <span className="rounded-full border border-white/10 bg-background/60 px-3 py-1 text-xs text-foreground">
                👤 {order.assignedToName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Requirements */}
      {order.requirements && (
        <div className="px-6 pt-5">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 dark:border-white/5 dark:bg-white/[0.03]">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              {t('orders.requirements')}
            </p>

           <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground dark:text-slate-200">
              {order.requirements}
            </p>
          </div>
        </div>
      )}
{order.cryptoPayments?.some((payment) => payment.status === 'pending') && (
  <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
    <h4 className="mb-3 text-sm font-semibold text-amber-800 dark:text-amber-300">
     {t('orders.pendingCryptoPayment')}
    </h4>

    <div className="space-y-3">
      {order.cryptoPayments
        .filter((payment) => payment.status === 'pending')
        .map((payment) => (
          <div
            key={payment.txHash}
            className="rounded-xl border border-border/40 bg-background/60 p-3"
          >
            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <p>
               {t('orders.type')}:
                <span className="font-semibold text-foreground">
                {payment.type === 'deposit'
                ? t('orders.deposit')
                : t('orders.finalPayment')}
                </span>
              </p>

              <p>
               {t('orders.amount')}:
                <span className="font-semibold text-foreground">
                  {payment.amount} {payment.currency}
                </span>
              </p>

              <p>
               {t('orders.network')}:
                <span className="font-semibold text-foreground">
                  {payment.network}
                </span>
              </p>

              <p>
               {t('orders.submitted')}:
                <span className="font-semibold text-foreground">
                  {new Date(payment.submittedAt).toLocaleString()}
                </span>
              </p>
            </div>

            <div className="mt-3 rounded-lg bg-muted/40 p-2">
              <p className="mb-1 text-xs text-muted-foreground">
              {t('orders.transactionHash')}
              </p>

  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
  <p className="break-all text-xs font-mono text-foreground">
    {payment.txHash}
  </p>

  <a
    href={`https://tronscan.org/#/transaction/${payment.txHash}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-500/20 dark:text-blue-300"
  >
   {t('orders.viewOnTronscan')}
    <ExternalLink className="h-3 w-3" />
  </a>
</div>

            </div>
{payment.verification && (
  <div
    className={`mt-3 rounded-xl p-3 text-xs font-semibold ${
      getVerificationBadge(payment.verification).className
    }`}
  >
    <p>{getVerificationBadge(payment.verification).label}</p>
    <p className="mt-1 font-normal">
      {payment.verification.reason}
    </p>
  </div>
)}
            <div className="mt-3 flex flex-wrap gap-2">
            <Button
  size="sm"
  onClick={() =>
    reviewCryptoPayment(order._id, payment.txHash, 'confirm')
  }
  disabled={
    reviewingCrypto ===
    `${order._id}-${payment.txHash}-confirm`
  }
  className="bg-green-600 hover:bg-green-700 text-white"
>
  {reviewingCrypto ===
  `${order._id}-${payment.txHash}-confirm`
    ? t('orders.confirming')
    : t('orders.confirmPayment')}
</Button>

             <Button
  size="sm"
  variant="outline"
  onClick={() =>
    reviewCryptoPayment(order._id, payment.txHash, 'reject')
  }
  disabled={
    reviewingCrypto ===
    `${order._id}-${payment.txHash}-reject`
  }
  className="border-red-500/30 text-red-600 hover:bg-red-500/10"
>
  {reviewingCrypto ===
  `${order._id}-${payment.txHash}-reject`
    ? t('orders.rejecting')
    : t('orders.reject')}
</Button>
           <Button
  size="sm"
  type="button"
  onClick={() =>
    recheckCryptoPayment(order._id, payment.txHash)
  }
  disabled={
    recheckingCrypto === `${order._id}-${payment.txHash}`
  }
  className="rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500 hover:border-amber-500/40 hover:bg-amber-500/20"
>
  {recheckingCrypto === `${order._id}-${payment.txHash}`
    ? t('orders.checking')
    : t('orders.recheck')}
</Button>
            </div>
          </div>
        ))}
    </div>
  </div>
)}
      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-5">
        {/* Accept */}
        {!order.assignedTo && order.status === 'pending' && (
        <Button
  size="sm"
  onClick={() => acceptOrder(order._id)}
  disabled={acceptingId === order._id}
  className="bg-emerald-600 text-white hover:bg-emerald-700"
>
  {acceptingId === order._id ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    t('orders.acceptOrder')
  )}
</Button>
        )}

        {/* Set Price */}
          {order.assignedToName &&
          order.paymentStatus !== 'fully_paid' &&
          order.status !== 'cancelled' && (
            <>
              {settingPrice === order._id ? (
                <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/5 p-2">
                  <input
                    type="number"
                    className="w-28 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                    placeholder={t('orders.finalPrice')}
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                  />

                  <Button
                    size="sm"
                    onClick={() => setFinalPrice(order._id)}
                    disabled={savingPrice}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {savingPrice ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                  t('orders.save')
                   )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSettingPrice(null)
                      setPriceInput('')
                    }}
                  >
                   {t('system.cancel')}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSettingPrice(order._id)}
                  className="border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20"
                >
                  💰 {t('orders.setPrice')}
                </Button>
              )}
              {order.assignedToName &&
  order.paymentStatus !== 'fully_paid' &&
  order.status !== 'cancelled' && (
    <>
      {settingTimeline === order._id ? (
        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2">
          <input
            type="text"
            className="w-36 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
            placeholder={t('orders.timelinePlaceholder')}
            value={timelineInput}
            onChange={(e) => setTimelineInput(e.target.value)}
          />

          <Button
            size="sm"
            onClick={() => setDeliveryTimeline(order._id)}
            disabled={savingTimeline}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {savingTimeline ? <Loader2 className="h-4 w-4 animate-spin" /> : t('orders.save')}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSettingTimeline(null)
              setTimelineInput('')
            }}
          >
           {t('system.cancel')}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSettingTimeline(order._id)
            setTimelineInput(order.deliveryEstimate || '')
          }}
          className="border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20"
        >
          🗓 {t('orders.setTimeline')}
        </Button>
      )}
    </>
  )}
            </>
          )}

        {/* Complete */}
        {order.status === 'in-progress' &&
          order.paymentStatus === 'deposit_paid' &&
          (isFounderRole(userRole) ||
            order.assignedTo === currentUserId) && (
            <Button
              size="sm"
              onClick={() => updateStatus(order._id, 'completed')}
              disabled={updatingId === order._id}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {updatingId === order._id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
             <>✓ {t('orders.markComplete')}</>
              )}
            </Button>
          )}

        {/* Cancel */}
        {(isFounderRole(userRole) ||
          (isModeratorRole(userRole) &&
            order.assignedTo === currentUserId)) &&
          order.status !== 'completed' &&
          order.status !== 'cancelled' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus(order._id, 'cancelled')}
              disabled={updatingId === order._id}
              className="border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20"
            >
            {t('orders.cancelOrder')}
            </Button>
          )}
        {/* Reassign */}
        {order.assignedToName &&
          isFounderRole(userRole) &&
          order.status !== 'completed' &&
          order.status !== 'cancelled' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setReassignModal({
                  open: true,
                  orderId: order._id,
                  currentName: order.assignedToName || '',
                })
              }
              className="border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20"
            >
              {t('orders.reassign')}
            </Button>
          )}
      </div>
{/* Internal Note Preview */}
{order.internalNote && (
  <div className="border-t border-border/50 px-6 py-4">
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-500">
        Internal Note
      </p>
      <p className="line-clamp-2 text-sm text-foreground">
        {order.internalNote}
      </p>
    </div>
  </div>
)}
      {/* Quick Links */}
     <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 bg-muted/10 px-6 py-4 dark:border-white/5 dark:bg-transparent">
  <div className="flex flex-wrap items-center gap-3">
        {/* Notes */}
        {(isFounderRole(userRole) ||
          (isModeratorRole(userRole) &&
            order.assignedTo === currentUserId)) && (
        <Button
  size="sm"
  variant="outline"
  onClick={() => {
    setEditingNote(order._id)
    setNoteText(order.internalNote || '')
  }}
  className="border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
>
  📝 {order.internalNote ? t('orders.editNote') : t('orders.addNote')}
</Button>
        )}

        {/* Files */}
        <button
          onClick={() => fetchFiles(order._id)}
          disabled={loadingFiles === order._id}
          className="flex items-center gap-2 rounded-xl border border-blue-500/10 bg-blue-500/5 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/10"
        >
          {loadingFiles === order._id ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <FileText className="h-3 w-3" />
          )}

         {expandedOrder === order._id ? t('orders.hideFiles') : t('orders.viewFiles')}
        </button>

        {/* Chat */}
        <button
          onClick={() => {
            setChatOrder(chatOrder === order._id ? null : order._id)

            if (chatOrder !== order._id) {
              setOrders((prev) =>
                prev.map((o) =>
                  o._id === order._id
                    ? {
                        ...o,
                        unreadMessages: 0,
                        hasUnreadMessages: false,
                      }
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
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
}, 300)
            }
          }}
          className="relative flex items-center gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-500/10"
        >
          <MessageCircle className="h-3 w-3" />

          {order.hasUnreadMessages && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {order.unreadMessages}
            </span>
          )}

         {chatOrder === order._id ? t('orders.hideChat') : t('orders.openChat')}
          
        </button>
        </div>
        <Button
  size="sm"
  variant="outline"
  onClick={() => deleteOrder(order._id)}
  className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
>
  <Trash2 className="mr-1 h-4 w-4" />
 {t('orders.delete')}
</Button>
      </div>

      {/* Files Expanded */}
      {expandedOrder === order._id && orderFiles[order._id] && (
        <div className="border-t border-white/5 px-6 py-4">
          <div className="space-y-2">
            {orderFiles[order._id].length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('ratings.noFiles')}
              </p>
            ) : (
              orderFiles[order._id].map((file) => (
                <a
                  key={file.id}
                  href={`/api/files/download?id=${file.id}`}
                  download={file.name}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition hover:border-blue-500/20 hover:bg-blue-500/5"
                >
                  <FileText className="h-4 w-4 text-blue-400" />

                  <span className="truncate">{file.name}</span>

                  <Download className="ml-auto h-4 w-4 text-muted-foreground" />
                </a>
              ))
            )}
          </div>
        </div>
      )}

      {/* Internal Notes */}
      {editingNote === order._id && (
        <div className="border-t border-white/5 px-6 py-4">
          <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
           {t('orders.internalNote')}
            </p>

            <textarea
              className="min-h-[90px] w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-amber-400"
              placeholder={t('orders.writeInternalNote')}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => saveNote(order._id)}
                disabled={savingNote}
                className="bg-amber-500 text-black hover:bg-amber-400"
              >
                {savingNote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
             t('orders.saveNote')
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingNote(null)
                  setNoteText('')
                }}
              >
              {t('system.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat */}
      {chatOrder === order._id && (
        <div
          id={`chat-${order._id}`}
          className="scroll-mt-24 border-t border-white/5 bg-black/20 px-6 py-5"
        >
          <OrderMessages orderId={order._id} userName="admin" />
        </div>
      )}
   </CardContent>
  </Card>
))}
 </div>
)}
  </>
   )}
</div>
</PremiumPageShell>
  </>
  )
}