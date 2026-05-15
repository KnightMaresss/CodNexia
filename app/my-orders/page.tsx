'use client'
import { useState, useEffect,useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { OrderMessages } from '@/components/OrderMessages'

import { 
  ArrowRight,
  Package, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Loader2, 
  ChevronRight, 
  Download, 
  Upload,
  Trash2,
  XCircle,
  MessageCircle,
   Star,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-context'
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/toast'

interface Order {
  _id: string
  service: string
  requirements: string
  status: string
  price: number
  finalPrice?: number
  paymentStatus?: string
  depositAmount?: number
  remainingAmount?: number
  createdAt: string
  assignedToName?: string
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

export default function MyOrdersPage() {
  
  const [chatOrder, setChatOrder] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [uploadingToOrder, setUploadingToOrder] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [orderFiles, setOrderFiles] = useState<Record<string, OrderFile[]>>({})
  const [loadingFiles, setLoadingFiles] = useState<string | null>(null)
  const [cancelModal, setCancelModal] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: '' })
  const [payingOrder, setPayingOrder] = useState<string | null>(null)
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/my-orders')
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders)
      }
    } catch {
      // silently fail
    }
    setLoading(false)
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
      if (data.success) {
        setOrderFiles((prev) => ({ ...prev, [orderId]: data.files }))
        setExpandedOrder(orderId)
      }
    } catch {
      // silently fail
    }
    setLoadingFiles(null)
  }
const [ratingOrder, setRatingOrder] = useState<string | null>(null)
const [ratingValue, setRatingValue] = useState(0)
const [ratingComment, setRatingComment] = useState('')
const [submittingRating, setSubmittingRating] = useState(false)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const [orderRatings, setOrderRatings] = useState<Record<string, any>>({})

const fetchRating = async (orderId: string) => {
    try {
      const res = await fetch(`/api/ratings?orderId=${orderId}`)
      const data = await res.json()
      if (data.success && data.rating) {
        setOrderRatings((prev) => ({ ...prev, [orderId]: data.rating }))
      }
    } catch {}
  }

   const submitRating = async (orderId: string) => {
    if (ratingValue === 0) {
      showToast('Please select a rating', 'error')
      return
    }
    setSubmittingRating(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, rating: ratingValue, comment: ratingComment }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('Thank you for your rating! ⭐', 'success')
        setOrderRatings((prev) => ({ ...prev, [orderId]: data.rating }))
        setRatingOrder(null)
        setRatingValue(0)
        setRatingComment('')
      } else {
        showToast(data.error || 'Failed to submit rating', 'error')
      }
    } catch {
      showToast('Failed to submit rating', 'error')
    }
    setSubmittingRating(false)
  }

  // Load PayPal SDK
useEffect(() => {
  // Check if script already exists to avoid duplicates
  const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]')
  if (existingScript) return
  
  const script = document.createElement('script')
  script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=EUR`
  script.async = true
  script.id = 'paypal-sdk-script'
  document.body.appendChild(script)
  
  return () => {
    // Safely remove only if it exists and is still a child
    const scriptToRemove = document.getElementById('paypal-sdk-script')
    if (scriptToRemove && scriptToRemove.parentNode) {
      scriptToRemove.parentNode.removeChild(scriptToRemove)
    }
  }
}, [])



const handlePayPalPayment = async (orderId: string, paymentType: 'deposit' | 'final') => {
  console.log('💰 Starting payment:', { orderId, paymentType })
  setPayingOrder(orderId)
  
  try {
    const res = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, paymentType }),
    })
    
    const data = await res.json()
    console.log('📦 Create order response:', data)
    
    if (!data.success) {
      showToast(data.error || 'Failed to create payment', 'error')
      setPayingOrder(null)
      return
    }
    
    // Store order info for when we return from PayPal
    sessionStorage.setItem('pendingOrderId', orderId)
    sessionStorage.setItem('pendingPaymentType', paymentType)
    
    console.log('💾 Stored in sessionStorage:', { orderId, paymentType })
    console.log('🔗 Redirecting to:', data.approvalUrl)
    
    // Redirect to PayPal
    if (data.approvalUrl) {
      window.location.href = data.approvalUrl
    } else {
      window.location.href = `https://www.sandbox.paypal.com/checkoutnow?token=${data.orderId}`
    }
    
  } catch (error) {
    console.error('Payment error:', error)
    showToast('Payment failed', 'error')
    setPayingOrder(null)
  }
}




  const cancelOrder = (orderId: string) => {
    setCancelModal({ open: true, orderId })
  }

  const confirmCancel = async () => {
    const orderId = cancelModal.orderId
    setCancelModal({ open: false, orderId: '' })
    setCancellingId(orderId)

    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('Order cancelled', 'success')
        fetchOrders()
      } else {
        showToast(data.error || 'Failed to cancel', 'error')
      }
    } catch {
      showToast('Failed to cancel order', 'error')
    }
    setCancellingId(null)
  }
  const handleFileUpload = async (orderId: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large. Max 10MB', 'error')
      return
    }

    setUploadingToOrder(orderId)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('orderId', orderId)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        showToast('File uploaded!', 'success')
        // Refresh files
        setOrderFiles((prev) => {
          const current = prev[orderId] || []
          return { ...prev, [orderId]: [...current, data.file] }
        })
      } else {
        showToast(data.error || 'Upload failed', 'error')
      }
    } catch {
      showToast('Upload failed', 'error')
    }
    setUploadingToOrder(null)
  }

    const handleDeleteFile = async (orderId: string, fileId: string) => {
    try {
      const res = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: fileId }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('File deleted', 'success')
        setOrderFiles((prev) => ({
          ...prev,
          [orderId]: prev[orderId].filter((f) => f.id !== fileId),
        }))
      } else {
        showToast('Failed to delete file', 'error')
      }
    } catch {
      showToast('Failed to delete file', 'error')
    }
  }


useEffect(() => {
  if (!authLoading && !user) {
    router.push('/login')
    return
  }

  if (!user) return
 // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchOrders()

  const eventSource = new EventSource('/api/my-orders/stream')

  eventSource.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data)

      if (message.type === 'connected' || message.type === 'heartbeat') {
        return
      }

      if (message.type === 'message-sent') {
        const senderRole = message.data?.senderRole
        const orderId = message.data?.orderId

        if (senderRole === 'admin' && chatOrder !== orderId) {
          const audio = new Audio('/chat.mp3')
          audio.play().catch(() => {})

          showToast('New chat message received', 'success')

          setOrders((prev) =>
            prev.map((order) =>
              order._id === orderId
                ? {
                    ...order,
                    unreadMessages: (order.unreadMessages || 0) + 1,
                    hasUnreadMessages: true,
                  }
                : order
            )
          )
        }

        fetchOrders()
        return
      }

      if (
        message.type === 'new-order' ||
        message.type === 'order-updated' ||
        message.type === 'order-deleted' ||
        message.type === 'order-reassigned'
      ) {
        fetchOrders()
      }
    } catch {}
  }

eventSource.onerror = () => {
  fetchOrders()
}

  return () => {
    eventSource.close()
  }
}, [user, authLoading, router, chatOrder])


  // Auto-open chat from email link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chatId = params.get('chat')
    if (chatId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChatOrder(chatId)
    }
  }, [])

  useEffect(() => {
    if (orders.length > 0) {
      orders.forEach((order) => {
        if (order.status === 'completed') {
          fetchRating(order._id)
        }
      })
    }
  }, [orders])

// Handle PayPal return redirect
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  const payerId = urlParams.get('PayerID')
  
  if (token && payerId) {
    // IMMEDIATELY clear URL parameters - this prevents re-running
    window.history.replaceState({}, '', '/my-orders')
    
    const orderId = sessionStorage.getItem('pendingOrderId')
    const paymentType = sessionStorage.getItem('pendingPaymentType')
    
    if (orderId && paymentType) {
      showToast('Completing payment...', 'success')
      
      fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paypalOrderId: token, 
          orderId, 
          paymentType 
        }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('Payment successful! ✅', 'success')
          fetchOrders()
        } else {
          showToast(data.error || 'Payment verification failed', 'error')
        }
      })
      .catch(() => {
        showToast('Payment verification failed', 'error')
      })
      .finally(() => {
        sessionStorage.removeItem('pendingOrderId')
        sessionStorage.removeItem('pendingPaymentType')
      })
    }
  }
}, [])



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
         case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-700'
        
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'in-progress': return <FileText className="h-4 w-4" />
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return null
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen pt-24 py-16 px-4 bg-gradient-to-br from-background to-muted">
        <div className="max-w-3xl mx-auto">
          {/* Header skeleton */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl mx-auto mb-4 animate-pulse" />
            <div className="w-48 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto mb-2 animate-pulse" />
            <div className="w-64 h-4 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto animate-pulse" />
          </div>
          {/* Order cards skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-6 shadow-sm border border-border animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-2">
                    <div className="w-40 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="w-28 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="w-12 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-24 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  <div className="w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (!user) return null

   return (
    <>
      <ConfirmModal
        isOpen={cancelModal.open}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        onConfirm={confirmCancel}
        onCancel={() => setCancelModal({ open: false, orderId: '' })}
      />
      <main className="min-h-screen pt-24 py-16 px-4 bg-gradient-to-br from-background to-muted">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-4">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground mt-2">Track all your orders in one place</p>
        </div>

        {orders.length === 0 ? (

                    <Card>
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                You haven&apos;t placed any orders yet. Start by browsing our services and placing your first order!
              </p>
              <Link href="/orders">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                  Place Your First Order
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">


                  <div className="flex items-center justify-between flex-wrap gap-4">
                     <div className="space-y-1">
                      <p className="font-semibold text-foreground">
                        {SERVICE_NAMES[order.service] || order.service}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                        <p className="text-xs text-muted-foreground">
                        Estimated delivery: {new Date(new Date(order.createdAt).setDate(new Date(order.createdAt).getDate() + 3)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(new Date(order.createdAt).setDate(new Date(order.createdAt).getDate() + 7)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status === 'in-progress' ? 'In Progress' : order.status}
                      </span>
                     <p className="font-bold text-green-600">{order.finalPrice ? `$${order.finalPrice}` : 'TBD'}</p>
                    </div>
                  </div>

  {/* Payment Info Box - Show for unpaid or deposit_paid orders */}
{(order.paymentStatus === 'unpaid' || order.paymentStatus === 'deposit_paid') && (
  <div className="mt-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
    <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
      💡 How payments work
    </h4>
    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5">
      <li>• 20% deposit starts your project</li>
      <li>• 80% final payment when work is complete</li>
      <li>• Secure payment via PayPal</li>
    </ul>
  </div>
)}
                    {/* Rating Section */}
                    {order.status === 'completed' && (
                      <div className="mt-3 pt-3 border-t border-border">
                        {orderRatings[order._id] ? (
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${star <= orderRatings[order._id].rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">Rated</span>
                            {orderRatings[order._id].comment && (
                             <p className="text-xs text-muted-foreground italic">&ldquo;{orderRatings[order._id].comment}&rdquo;</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            {ratingOrder === order._id ? (
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-foreground">Rate your experience:</p>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setRatingValue(star)}
                                      className="transition-all hover:scale-110"
                                    >
                                      <Star
                                        className={`h-6 w-6 ${star <= ratingValue ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                      />
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  placeholder="Share your experience (optional)..."
                                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm resize-none"
                                  rows={2}
                                  value={ratingComment}
                                  onChange={(e) => setRatingComment(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => submitRating(order._id)}
                                    disabled={submittingRating || ratingValue === 0}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
                                  >
                                    {submittingRating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Submit Rating'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setRatingOrder(null); setRatingValue(0); setRatingComment('') }}
                                    className="text-xs"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRatingOrder(order._id)}
                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 border-yellow-300"
                              >
                                <Star className="h-3 w-3 mr-1" />
                                Rate Order
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment Buttons */}
  {order.finalPrice && (order.status === 'pending' || order.status === 'in-progress') && order.paymentStatus === 'unpaid' && (
  <div className="mt-3 pt-3 border-t border-border">
    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 mb-3">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
        💰 Ready to start?
      </p>
      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
        Pay 20% deposit (${order.depositAmount}) to begin work on your project.
        The remaining ${order.remainingAmount} is due when work is complete.
      </p>
    </div>
    <Button
      size="sm"
      onClick={() => handlePayPalPayment(order._id, 'deposit')}
      disabled={payingOrder === order._id}
      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
    >
      {payingOrder === order._id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "💰"}
      Pay 20% Deposit (${order.depositAmount}) to Start
    </Button>
  </div>
)}
{/* After Deposit - Waiting for completion */}
{order.paymentStatus === 'deposit_paid' && order.status !== 'completed' && (
  <div className="mt-3 bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <p className="text-sm font-medium text-green-800 dark:text-green-300">
        ✅ Deposit paid! We have started working on your project.
      </p>
    </div>
    <p className="text-xs text-green-700 dark:text-green-400 mt-1 ml-6">
      You will pay the remaining ${order.remainingAmount} when work is complete.
    </p>
  </div>
)}
{order.status === 'completed' && order.paymentStatus === 'deposit_paid' && (
  <div className="mt-3 pt-3 border-t border-border">
    <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 mb-3">
      <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
        🎉 Your project is ready!
      </p>
      <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
        Pay the remaining ${order.remainingAmount} to download your completed work.
      </p>
    </div>
    <Button
      size="sm"
      onClick={() => handlePayPalPayment(order._id, 'final')}
      disabled={payingOrder === order._id}
      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2"
    >
      {payingOrder === order._id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "📥"}
      Pay ${order.remainingAmount} to Download Work
    </Button>
  </div>
)}
      {order.paymentStatus === 'fully_paid' && (
  <div className="mt-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3">
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
        ✅ Fully Paid - Thank you for your business!
      </p>
    </div>
    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 ml-6">
      Your files are available for download below.
    </p>
  </div>
)}
                    <div className="mt-4 flex gap-2 flex-wrap">
                    <Link href={`/track?id=${order._id}&direct=true`}>
                      <Button size="sm" variant="outline">
                        Track Order
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelOrder(order._id)}
                        disabled={cancellingId === order._id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {cancellingId === order._id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        Cancel
                      </Button>
                    )}
<Button
  size="sm"
  variant="outline"
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
            block: 'center',
          })
      }, 100)
    }
  }}
  className="flex items-center gap-2"
>
  <MessageCircle className="h-3 w-3" />

  {order.hasUnreadMessages && (
    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {order.unreadMessages}
    </span>
  )}

  {chatOrder === order._id ? 'Hide Chat' : 'Chat'}
</Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchFiles(order._id)}
                    >
                      {loadingFiles === order._id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <FileText className="h-3 w-3 mr-1" />
                      )}
                      {expandedOrder === order._id ? 'Hide Files' : 'View Files'}
                    </Button>
                  </div>

                  {/* Files List */}
                  {expandedOrder === order._id && orderFiles[order._id] && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-3">
                        Attached Files ({orderFiles[order._id].length}/5)
                      </p>
                      {orderFiles[order._id].length < 5 && (
                        
  <button
  
    onClick={() => {
      if (fileInputRef.current) {
        fileInputRef.current.dataset.orderId = order._id
        fileInputRef.current.click()
      }
    }}
    disabled={uploadingToOrder === order._id}
    className="w-full border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-blue-400 transition-all mb-3"
  >
    {uploadingToOrder === order._id ? (
      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
    ) : (
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Upload className="h-3 w-3" />
        Upload more files
      </div>
    )}
  </button>
  
)}
                      {orderFiles[order._id].length === 0 ? (
                        <p className="text-sm text-muted-foreground">No files attached yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {orderFiles[order._id].map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between bg-muted rounded-lg px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-foreground">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({(file.size / 1024 / 1024).toFixed(1)}MB)
                                </span>
                              </div>
                              
<div className="flex items-center gap-2">
  <a
    href={`/api/files/download?id=${file.id}`}
    className="text-blue-600 hover:text-blue-800"
  >
    <Download className="h-4 w-4" />
  </a>
  <button
    onClick={() => handleDeleteFile(order._id, file.id)}
    className="text-red-500 hover:text-red-700"
  >
    <Trash2 className="h-4 w-4" />
  </button>
</div>

                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                     {/* Chat */}
{chatOrder === order._id && (
  <div id={`chat-${order._id}`} className="mt-4 pt-4 border-t">
    <p className="text-xs text-muted-foreground mb-3">Messages</p>
    <OrderMessages orderId={order._id} userName={user?.name} />
  </div>
)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
            <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.zip"
        onChange={(e) => {
          const file = e.target.files?.[0]
          const orderId = e.target.dataset.orderId
          if (file && orderId) {
            handleFileUpload(orderId, file)
          }
          e.target.value = ''
        }}
      />
      
    </main>
     </>
  )
}