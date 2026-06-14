'use client'
import { useState, useEffect,useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { OrderMessages } from '@/components/OrderMessages'
import Image from 'next/image'
import { useTranslations,useLocale } from 'next-intl'
import { 
ArrowRight,
Package, 
Clock, 
CheckCircle2, 
Loader2, 
Download, 
Upload,
Trash2,
XCircle,
MessageCircle,
Star,
FileText,
FileImage,
FileArchive,
ArrowLeft
} 
from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/components/auth-context'
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/toast'
import PremiumPageShell from '@/components/PremiumPageShell'
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
  deliveryEstimate?: string
}
interface OrderFile {
  id: string
  name: string
  size: number
  url: string
}



function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    return <FileText className="h-4 w-4 text-red-500" />
  }

  if (['doc', 'docx'].includes(ext || '')) {
    return <FileText className="h-4 w-4 text-blue-500" />
  }

  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    return <FileImage className="h-4 w-4 text-cyan-500" />
  }

  if (ext === 'zip') {
    return <FileArchive className="h-4 w-4 text-amber-500" />
  }

  return <FileText className="h-4 w-4 text-slate-500" />
}
export default function MyOrdersPage() {
  const t = useTranslations('MyOrders')
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const getServiceName = (service: string, t: ReturnType<typeof useTranslations>) => {
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
  const [chatOrder, setChatOrder] = useState<string | null>(null)
  useEffect(() => {
  if (chatOrder) {
    sessionStorage.setItem('openOrderChatId', chatOrder)
  } else {
    sessionStorage.removeItem('openOrderChatId')
  }

  return () => {
    sessionStorage.removeItem('openOrderChatId')
  }
}, [chatOrder])
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
  const previousUnreadTotalRef = useRef(0)
  const handledChatParamRef = useRef(false)
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/my-orders')
      const data = await res.json()


if (data.success) {
  const unreadTotal = data.orders.reduce(
    (sum: number, order: Order) => sum + (order.unreadMessages || 0),
    0
  )

  if (!chatOrder && unreadTotal > previousUnreadTotalRef.current) {
  }

  previousUnreadTotalRef.current = unreadTotal
  setOrders(data.orders)
}


    } 
    
    catch {
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
      showToast(t('messages.selectRating'), 'error')
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
        showToast(t('messages.ratingThanks'), 'success')
        setOrderRatings((prev) => ({ ...prev, [orderId]: data.rating }))
        setRatingOrder(null)
        setRatingValue(0)
        setRatingComment('')
      } else {
        showToast(data.error || t('messages.ratingFailed'), 'error')
      }
    } catch {
      showToast(t('messages.ratingFailed'), 'error')
    }
    setSubmittingRating(false)
  }
const openCheckout = (
  orderId: string,
  paymentType: 'deposit' | 'final'
) => {
  router.push(
    `/checkout?orderId=${orderId}&type=${paymentType}`
  )
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
        showToast(t('messages.cancelled'), 'success')
        fetchOrders()
      } else {
        showToast(data.error || t('messages.cancelFailed'), 'error')
      }
    } catch {
      showToast(t('messages.cancelOrderFailed'), 'error')
    }
    setCancellingId(null)
  }
  const handleFileUpload = async (orderId: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast(t('messages.fileTooLarge'), 'error')
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
        showToast(t('messages.fileUploaded'), 'success')
        // Refresh files
        setOrderFiles((prev) => {
          const current = prev[orderId] || []
          return { ...prev, [orderId]: [...current, data.file] }
        })
      } else {
        showToast(data.error || t('messages.uploadFailed'), 'error')
      }
    } catch {
      showToast(t('messages.uploadFailed'), 'error')
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
        showToast(t('messages.fileDeleted'), 'success')
        setOrderFiles((prev) => ({
          ...prev,
          [orderId]: prev[orderId].filter((f) => f.id !== fileId),
        }))
      } else {
        showToast(t('messages.deleteFailed'), 'error')
      }
    } catch {
      showToast(t('messages.deleteFailed'), 'error')
    }
  }




useEffect(() => {
  if (!authLoading && !user) {
    router.push('/login')
    return
  }

  if (!user) return
  const startTimeout = setTimeout(() => {
  fetchOrders()
  }, 0)

  const interval = setInterval(() => {
    fetchOrders()
  }, 3000)

 return () => {
  clearTimeout(startTimeout)
  clearInterval(interval)
}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [user])


// Auto-open chat from notification/email link once after orders load
useEffect(() => {
  if (handledChatParamRef.current) return
  if (orders.length === 0) return

  const params = new URLSearchParams(window.location.search)
  const chatId = params.get('chat')

  if (!chatId) return

  const orderExists = orders.some((order) => order._id === chatId)

  if (!orderExists) return

  handledChatParamRef.current = true

  window.setTimeout(() => {
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
}, [orders])


  


  useEffect(() => {
    if (orders.length > 0) {
      orders.forEach((order) => {
        if (order.status === 'completed') {
          fetchRating(order._id)
        }
      })
    }
  }, [orders])

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
  return null
}
    
  

  if (!user) return null

   return (
    <>
      <ConfirmModal
        isOpen={cancelModal.open}
        title={t('modal.cancelTitle')}
        message={t('modal.cancelMessage')}
        onConfirm={confirmCancel}
        onCancel={() => setCancelModal({ open: false, orderId: '' })}
      />
   <PremiumPageShell className="pt-20 py-10 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-4">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>

        {orders.length === 0 ? (

          <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none animate-[fadeUp_0.6s_ease-out]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_40%)]" />
            <CardContent className="py-16 text-center">
              <div className="animate-[float_6s_ease-in-out_infinite] w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(37,99,235,0.18)]">
                <Package className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{t('empty.title')}</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
               {t('empty.description')}
              </p>
              <Link href="/orders">

             <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
  {t('empty.button')}
  {isRTL ? (
    <ArrowLeft className="mr-2 h-5 w-5" />
  ) : (
    <ArrowRight className="ml-2 h-5 w-5" />
  )}
</Button>
              </Link>
            </CardContent>
          </Card>

        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
             <Card
             
             key={order._id}
             className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none animate-[fadeUp_0.6s_ease-out]"
                >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_40%)]" />
             <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.12),transparent_70%)] opacity-60" />
               <CardContent className="p-5 sm:p-6">


                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                     <div className="space-y-1">
                      <p className="font-semibold text-foreground">
                        {getServiceName(order.service, t)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      
                      <p className="text-xs text-muted-foreground">
                       {t('order.estimatedTimeline')}: {order.deliveryEstimate || t('order.toBeConfirmed')}
                         </p>

                    </div>

                   <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {
  order.status === 'pending'
    ? t('status.pending')
    : order.status === 'in-progress'
    ? t('status.inProgress')
    : order.status === 'completed'
    ? t('status.completed')
    : t('status.cancelled')
}
                      </span>
                     <p className="font-bold text-green-600">{order.finalPrice ? `$${order.finalPrice}` : t('order.tbd')}</p>
                    </div>
                  </div>
<div className="mt-5 rounded-2xl sm:rounded-3xl border-2 border-border/40 bg-background/40 px-2 py-4 sm:px-4 backdrop-blur-xl transition-all duration-500 hover:border-blue-500/30 hover:shadow-[0_12px_40px_rgba(37,99,235,0.12)]">
  <div className="flex items-center justify-between">
    {[
     { key: 'pending', label: t('status.received'), icon: Clock },
     { key: 'in-progress', label: t('status.inProgress'), icon: FileText },
     { key: 'completed', label: t('status.completed'), icon: CheckCircle2 },
    ].map((step, index, arr) => {
      const statusOrder = ['pending', 'in-progress', 'completed']
      const currentIndex = statusOrder.indexOf(order.status)
      const stepIndex = statusOrder.indexOf(step.key)
      const isActive = currentIndex === stepIndex
      const isDone = currentIndex > stepIndex || order.status === 'completed'
      const Icon = step.icon

      return (
        <div key={step.key} className="flex flex-1 items-center">
          <div className="flex flex-col items-center gap-2">
            <div
             className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border transition-all ${
                isDone
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : isActive
                    ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'border-border bg-background text-muted-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
           <span className="text-center text-[11px] leading-tight font-medium text-muted-foreground sm:text-xs">
              {step.label}
            </span>
          </div>

          {index < arr.length - 1 && (
            <div
                className={`mx-1 h-px flex-1 sm:mx-3 ${
                isDone ? 'bg-emerald-500' : 'bg-border'
              }`}
            />
          )}
        </div>
      )
    })}
  </div>
</div>
  {/* Payment Info Box - Show for unpaid or deposit_paid orders */}
{order.paymentStatus === 'unpaid' && (
 <div className="mt-3 rounded-2xl bg-blue-500/10 p-3 text-sm dark:bg-blue-950/30">
    <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
      {t('payments.howTitle')}
    </h4>
    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5">
      <li>{t('payments.depositStart')}</li>
      <li>{t('payments.finalPayment')}</li>
     <li>{t('payments.crypto')}</li>
    </ul>
  </div>
)}
{order.paymentStatus === 'pending_crypto_verification' && (
  <div className="mt-3 bg-amber-500/10 dark:bg-amber-950/30 rounded-lg p-3">
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-amber-600" />
      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
        {t('payments.pendingVerification')}
      </p>
    </div>
    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 ml-6">
      {t('payments.verificationText')}
    </p>
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
                            <span className="text-sm text-muted-foreground">{t('rating.rated')}</span>
                            {orderRatings[order._id].comment && (
                             <p className="text-xs text-muted-foreground italic">&ldquo;{orderRatings[order._id].comment}&rdquo;</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            {ratingOrder === order._id ? (
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-foreground">{t('rating.title')}</p>
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
                                  placeholder={t('rating.placeholder')}
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
                                    {submittingRating ? <Loader2 className="h-3 w-3 animate-spin" /> : t('rating.submit')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setRatingOrder(null); setRatingValue(0); setRatingComment('') }}
                                    className="text-xs"
                                  >
                                   {t('rating.cancel')}
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
                                {t('rating.button')}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment Buttons */}
  {order.finalPrice && (order.status === 'pending' || order.status === 'in-progress') && order.paymentStatus === 'unpaid' && (
  <div className="mt-3 pt-3 border-t border-border">
    <div className="bg-amber-500/10 dark:bg-amber-950/30 rounded-lg p-3 mb-3">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
        {t('payments.readyTitle')}
      </p>
     <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
  {t('payments.readyText', {
   deposit: order.depositAmount ?? 0,
   remaining: order.remainingAmount ?? 0,
  })}
</p>
    </div>
    <Button
      size="sm"
      onClick={() => openCheckout(order._id, 'deposit')}
      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
    >
     {t('payments.payDeposit', {
deposit: order.depositAmount ?? 0,
     })}
    </Button>
  </div>
)}
{/* After Deposit - Waiting for completion */}
{order.paymentStatus === 'deposit_paid' && order.status !== 'completed' && (
  <div className="mt-3 bg-green-500/10 dark:bg-green-950/30 rounded-lg p-3">
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <p className="text-sm font-medium text-green-800 dark:text-green-300">
        {t('payments.depositPaid')}
      </p>
    </div>
    <p className="text-xs text-green-700 dark:text-green-400 mt-1 ml-6">
      {t('payments.depositPaidText', {
 remaining: order.remainingAmount ?? 0,
})}
    </p>
  </div>
)}
{order.status === 'completed' && order.paymentStatus === 'deposit_paid' && (
  <div className="mt-3 pt-3 border-t border-border">
    <div className="bg-purple-500/10 dark:bg-purple-950/30 rounded-lg p-3 mb-3">
      <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
        {t('payments.projectReady')}
      </p>
      <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
        {t('payments.projectReadyText', {
 remaining: order.remainingAmount ?? 0,
})}
      </p>
    </div>
    <Button
      size="sm"
      onClick={() => openCheckout(order._id, 'final')}
      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2"
    >
    {t('payments.downloadWork', {
 remaining: order.remainingAmount ?? 0,
})}
    </Button>
  </div>
)}
      {order.paymentStatus === 'fully_paid' && (
  <div className="mt-3 bg-emerald-500/10 dark:bg-emerald-950/30 rounded-lg p-3">
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
        {t('payments.fullyPaid')}
      </p>
    </div>
    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 ml-6">
      {t('payments.fullyPaidText')}
    </p>
  </div>
)}

<div className="mt-5 grid grid-cols-2 gap-2 border-t border-border/50 pt-5 sm:flex sm:items-center sm:gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchFiles(order._id)}
                      className="w-full justify-center sm:w-auto rounded-xl transition-all hover:scale-[1.02] border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-300"
                    >
                      {loadingFiles === order._id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <FileText className="h-3 w-3 mr-1" />
                      )}
                      {expandedOrder === order._id ? t('actions.hideFiles') : t('actions.viewFiles')}
                    </Button>
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
      }, 300)
    }
  }}
 className="w-full justify-center sm:w-auto justify-center rounded-xl transition-all hover:scale-[1.02] flex items-center gap-2 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-300"
>
  <MessageCircle className="h-3 w-3" />
  {order.hasUnreadMessages && (
    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {order.unreadMessages}
    </span>
  )}
{chatOrder === order._id ? t('actions.hideChat') : t('actions.chat')}
</Button>
                     {order.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelOrder(order._id)}
                        disabled={cancellingId === order._id}
                        className="col-span-2 mx-auto w-full max-w-[140px] justify-center rounded-xl border-red-500/20 bg-red-500/10 text-red-600 transition-all hover:scale-[1.02] hover:bg-red-500/20 dark:text-red-300 sm:ms-auto sm:mx-0 sm:w-auto sm:max-w-none"
  >
                        {cancellingId === order._id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {t('actions.cancel')}
                      </Button>
                    )}
                  </div>

                  {/* Files List */}
                  {expandedOrder === order._id && orderFiles[order._id] && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-3">
                        {t('files.attached')} ({orderFiles[order._id].length}/5)
                      </p>
                      {orderFiles[order._id].length < 5 && (
                        
<button
  type="button"
  onClick={() => {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.orderId = order._id
      fileInputRef.current.click()
    }
  }}
  onDragOver={(e) => {
    e.preventDefault()
    e.currentTarget.classList.add(
      'border-blue-500',
      'bg-blue-500/10',
      'shadow-[0_0_30px_rgba(37,99,235,0.16)]'
    )
  }}
  onDragLeave={(e) => {
    e.currentTarget.classList.remove(
      'border-blue-500',
      'bg-blue-500/10',
      'shadow-[0_0_30px_rgba(37,99,235,0.16)]'
    )
  }}
  onDrop={(e) => {
    e.preventDefault()

    e.currentTarget.classList.remove(
      'border-blue-500',
      'bg-blue-500/10',
      'shadow-[0_0_30px_rgba(37,99,235,0.16)]'
    )

    if (fileInputRef.current) {
      fileInputRef.current.dataset.orderId = order._id
    }

    const droppedFile = e.dataTransfer.files?.[0]

    if (!droppedFile) return

    if (droppedFile.size > 10 * 1024 * 1024) {
      showToast(t('messages.fileTooLargeDot'), 'warning')
      return
    }

    handleFileUpload(order._id, droppedFile)
  }}
  disabled={uploadingToOrder === order._id}
  className="mb-3 w-full rounded-2xl border-2 border-dashed border-border/40 bg-background/50 p-4 text-center backdrop-blur-sm transition-all duration-300 hover:border-blue-400 hover:bg-blue-500/10 hover:shadow-[0_8px_24px_rgba(37,99,235,0.10)] disabled:cursor-not-allowed disabled:opacity-60"
>
  {uploadingToOrder === order._id ? (
    <Loader2 className="mx-auto h-4 w-4 animate-spin text-blue-500" />
  ) : (

   <div className="flex flex-col items-center justify-center gap-2">
  <div className="relative flex h-10 w-10 items-center justify-center">
    <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-lg transition-all duration-500 group-hover:bg-blue-500/20" />
    <Upload className="relative h-4 w-4 text-blue-500 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
  </div>
 <span className="text-center text-[11px] leading-tight font-medium text-muted-foreground sm:text-xs">
    {t('files.dragUpload')}
  </span>
</div>

  )}
</button>
  
)}
   {orderFiles[order._id].length === 0 ? (
    <div className="rounded-2xl border border-border/40 bg-background/40 px-4 py-6 text-center backdrop-blur-sm">
  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
    <Upload className="h-5 w-5 text-blue-400" />
  </div>

  <p className="text-sm font-medium text-foreground">
    {t('files.noneTitle')}
  </p>

  <p className="mt-1 text-xs text-muted-foreground">
    {t('files.noneDescription')}
  </p>
</div>

  ) : (
<div className="space-y-2">
  {orderFiles[order._id].map((file) => (
   <div
key={file.id}
className="group flex items-center justify-between rounded-xl border border-border/40 bg-background/60 px-3 py-2 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/30 hover:bg-background/80 hover:shadow-[0_8px_24px_rgba(37,99,235,0.10)]"                            >
  <div className="flex items-center gap-2">
  {file.name.match(/\.(jpg|jpeg|png|webp)$/i) ? (
  <div className="h-9 w-9 overflow-hidden rounded-lg border border-border/40 bg-background/60">
   <Image
  src={file.url}
  alt={file.name}
  width={36}
  height={36}
  className="h-full w-full object-cover"
/>
  </div>
) : (
   getFileIcon(file.name)
)}
        <span className="text-sm text-foreground">{file.name}</span>
        <span className="text-xs text-muted-foreground">
       ({(file.size / 1024 / 1024).toFixed(1)}MB)
      </span>
    <span className="hidden items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300 sm:inline-flex">
  <CheckCircle2 className="h-3 w-3" />
  {t('files.uploaded')}
</span>
                              </div>
                              
<div className="flex items-center gap-2">
  <a
    href={`/api/files/download?id=${file.id}`}
   className="rounded-lg p-1.5 text-blue-500 transition-all duration-300 hover:bg-blue-500/10 hover:text-blue-600"
  >
    <Download className="h-4 w-4" />
  </a>
  <button
    onClick={() => handleDeleteFile(order._id, file.id)}
    className="rounded-lg p-1.5 text-red-500 transition-all duration-300 hover:bg-red-500/10 hover:text-red-600"
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
  <div id={`chat-${order._id}`} className="scroll-mt-24 mt-5 pt-5 border-t border-border/50">
    <p className="text-xs text-muted-foreground mb-3">{t('actions.messages')}</p>
   <OrderMessages orderId={order._id} userName="student" />
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
  </PremiumPageShell>

     </>
  )
}