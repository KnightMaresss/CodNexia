'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { showToast } from '@/components/ui/toast'
import { canAccessAdmin, isFounderRole, isModeratorRole } from '@/lib/roles'
import {
  ArrowRight,
  User,
  Mail,
  Lock,
  Camera,
  Package,
  Save,
  Loader2,
  Shield,
  Clock,
  ShoppingBag,
  CheckCircle2,
  Crown,
  DollarSign,
  Users,
  Star,
  LayoutDashboard,
  BarChart3,
  CreditCard,
  Receipt,
  ExternalLink,
} from 'lucide-react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/components/auth-context'
import { useRouter } from 'next/navigation'
import PremiumPageShell from '@/components/PremiumPageShell'
import { useTranslations } from 'next-intl'
export default function ProfilePage() {

const t = useTranslations('Profile')
const getServiceName = (service: string) => {
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
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewedUser, setViewedUser] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'payments'>('profile')
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    myOrders: 0,
    myCompleted: 0,
    myRating: 0,
    modCount: 0,
  })
  type PaymentOrder = {
  _id: string
  service: string
  cryptoPayments?: {
    txHash: string
    amount: number
    currency: string
    network: string
    type: 'deposit' | 'final'
    status: string
    submittedAt: string
    confirmedAt?: string
  }[]
  nowPayments?: {
    paymentId: string
    type: 'deposit' | 'final'
    amount: number
    currency: string
    status: string
    invoiceUrl?: string | null
    createdAt: string
    confirmedAt?: string
    payCurrency?: string | null
    payAmount?: number | null
    actuallyPaid?: number | null
  }[]
}

const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([])
  const [ordersCount, setOrdersCount] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])
    // Check if founder is viewing another user's profile
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const viewId = params.get('id')
   if (viewId && isFounderRole(user?.role)) {
      fetch(`/api/admin/user?id=${viewId}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setViewedUser(data.user)
          }
        })
        .catch(() => {})
    }
  }, [user])

useEffect(() => {
  if (!user || canAccessAdmin(user.role)) return

  fetch('/api/my-orders')
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setPaymentOrders(data.orders || [])
      }
    })
    .catch(() => {})
}, [user])

// Fetch viewed user's orders count (all orders, all statuses)
useEffect(() => {
  if (viewedUser) {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          let orderCount = 0
         if (canAccessAdmin(viewedUser.role)) {
            // Count all orders assigned to them (pending, in-progress, completed, cancelled)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            orderCount = data.orders.filter((o: any) => o.assignedTo === viewedUser.id).length
          } else if (viewedUser.role === 'student') {
            // Count all orders placed by this student email
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            orderCount = data.orders.filter((o: any) => o.studentEmail === viewedUser.email).length
          }
          setOrdersCount(orderCount)
        }
      })
      .catch(() => {})
  }
}, [viewedUser]) 

   useEffect(() => {
    if (user && !viewedUser) {
       // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData((prev) => ({ ...prev, name: user.name, email: user.email }))

     if (isFounderRole(user.role)) {
        // Fetch all stats for founder
        Promise.all([
          fetch('/api/orders').then(r => r.json()),
          fetch('/api/admin/users').then(r => r.json()),
          fetch('/api/admin/moderator-stats').then(r => r.json()),
          fetch('/api/ratings').then(r => r.json()),
        ]).then(([ordersData, usersData, modData, ratingsData]) => {
          const allOrders = ordersData.success ? ordersData.orders : []
          const users = usersData.success ? usersData.users : []
          const moderators = modData.success ? modData.moderators : []
         
          const ratings = ratingsData.success ? ratingsData.ratings : []

          const totalRevenue = allOrders
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
             .filter((o: any) => o.status === 'completed' && o.paymentStatus === 'fully_paid')
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .reduce((sum: number, o: any) => sum + (o.finalPrice || o.price || 0), 0)
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const founderOrders = allOrders.filter((o: any) => o.assignedToName === user.name || o.assignedTo === user.id)
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const founderCompleted = founderOrders.filter((o: any) => o.status === 'completed')
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const founderCompletedIds = founderCompleted.map((o: any) => o._id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const founderRatings = ratings.filter((r: any) => founderCompletedIds.includes(r.orderId))
          const avgRating = founderRatings.length > 0
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? Math.round((founderRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / founderRatings.length) * 10) / 10
            : 0

          setStats({
            totalOrders: allOrders.length,
            totalRevenue,
            totalUsers: users.length,
            myOrders: founderOrders.length,
            myCompleted: founderCompleted.length,
            myRating: avgRating,
            modCount: moderators.length,
          })
          setOrdersCount(founderOrders.length)
        }).catch(() => {})
     } else if (isModeratorRole(user.role)) {
        fetch('/api/orders')
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const completedCount = data.orders.filter((o: any) => o.status === 'completed').length
              setOrdersCount(completedCount)
            }
          })
          .catch(() => {})
      } else {
        fetch('/api/my-orders')
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setOrdersCount(data.orders.length)
            }
          })
          .catch(() => {})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(t('toasts.profileUpdated'), 'success')
        refreshUser()
      } else {
        showToast(data.error || t('toasts.updateFailed'), 'error')
      }
    } catch {
      showToast(t('toasts.somethingWentWrong'), 'error')
    }
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      showToast(t('toasts.passwordsDoNotMatch'), 'error')
      return
    }
    if (formData.newPassword.length < 6) {
      showToast(t('toasts.passwordMinLength'), 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(t('toasts.passwordChanged'), 'success')
        setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      } else {
        showToast(data.error || t('toasts.passwordChangeFailed'), 'error')
      }
    } catch {
      showToast(t('toasts.somethingWentWrong'), 'error')
    }
    setSaving(false)
  }

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPic(true)
    const formDataUpload = new FormData()
    formDataUpload.append('profilePic', file)
    try {
      const res = await fetch('/api/profile/picture', {
        method: 'POST',
        body: formDataUpload,
      })
      const data = await res.json()
      if (data.success) {
        showToast(t('toasts.pictureUpdated'), 'success')
        refreshUser()
      } else {
        showToast(data.error || t('toasts.uploadFailed'), 'error')
      }
    } catch {
      showToast(t('toasts.uploadFailed'), 'error')
    }
    setUploadingPic(false)
  }

if (loading) {
  return null
}
 
  if (!user) return null
  const displayUser = viewedUser || user
  const isViewingOther = !!viewedUser
 const isFounder = isFounderRole(displayUser.role)
const isModerator = isModeratorRole(displayUser.role)
const paymentHistory = paymentOrders
  .flatMap((order) => [
    ...(order.cryptoPayments || []).map((payment) => ({
      source: 'manual',
      id: payment.txHash,
      type: payment.type,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      date: payment.confirmedAt || payment.submittedAt,
      service: order.service,
      link: `https://tronscan.org/#/transaction/${payment.txHash}`,
    })),
    ...(order.nowPayments || []).map((payment) => ({
      source: 'nowpayments',
      id: payment.paymentId,
      type: payment.type,
      amount: payment.actuallyPaid || payment.payAmount || payment.amount,
      currency: payment.payCurrency || payment.currency,
      status: payment.status,
      date: payment.confirmedAt || payment.createdAt,
      service: order.service,
      link: payment.invoiceUrl || null,
    })),
  ])
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return (
    <PremiumPageShell className="pt-20 py-10 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative group inline-block">
            <div className={`w-28 h-28 rounded-full ring-4 ${isFounder ? 'ring-yellow-400' : 'ring-muted'} bg-muted flex items-center justify-center overflow-hidden mx-auto transition-all duration-300 group-hover:scale-105`}>
                {displayUser.profilePic ? (
                 <Image 
                  src={displayUser.profilePic} 
                 alt={t('toasts.profilePicture')}
                  width={112} 
                  height={112} 
                  className="w-full h-full object-cover" 
                  loading="eager"
                  fetchPriority="high"
                   />
              ) : (
                <User className="h-14 w-14 text-muted-foreground" />
              )}
            </div>

             {!isViewingOther && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPic}
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-md hover:scale-110"
                >
                  {uploadingPic ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePictureUpload} />
              </>
            )}
          </div>
         <h1 className="text-3xl font-bold tracking-tight text-foreground mt-4 flex items-center justify-center gap-2">
            {displayUser.name}
            {!isViewingOther && isFounder && <Crown className="h-5 w-5 text-yellow-500" />}
          </h1>
          <p className="mx-auto flex max-w-[280px] items-center justify-center gap-1 truncate text-sm text-muted-foreground sm:max-w-none">
          <Mail className="h-3 w-3" />{displayUser.email}
          </p>
        </div>

        {/* Founder Stats - only for own profile */}
        {!isViewingOther && isFounder && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
             <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <Package className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">{t('stats.allOrders')}</p>
                </CardContent>
              </Card>
          <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-600">${stats.totalRevenue}</p>
                  <p className="text-xs text-muted-foreground">{t('stats.revenue')}</p>
                </CardContent>
              </Card>
            <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">{t('stats.users')}</p>
                </CardContent>
              </Card>
            <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <Shield className="h-5 w-5 text-indigo-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.modCount}</p>
                  <p className="text-xs text-muted-foreground">{t('stats.moderators')}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-yellow-500/30 hover:shadow-[0_20px_60px_rgba(234,179,8,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <Crown className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{stats.myOrders}</p>
                  <p className="text-xs text-muted-foreground">{t('stats.myOrders')}</p>
                </CardContent>
              </Card>
             <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-yellow-500/30 hover:shadow-[0_20px_60px_rgba(234,179,8,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{stats.myCompleted}</p>
                  <p className="text-xs text-muted-foreground">{t('stats.myCompleted')}</p>
                </CardContent>
              </Card>
             <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-yellow-500/30 hover:shadow-[0_20px_60px_rgba(234,179,8,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <Star className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-500">{stats.myRating || '—'}</p>
                  <p className="text-xs text-muted-foreground">{t('stats.myRating')}</p>
                </CardContent>
              </Card>
             <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-yellow-500/30 hover:shadow-[0_20px_60px_rgba(234,179,8,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <Clock className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-blue-600">{t('stats.active')}</p>
                  <p className="text-xs text-muted-foreground">{t('stats.account')}</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Non-founder Stats Row */}
        {!isFounder && (
        <div className="grid grid-cols-3 items-start gap-1.5 sm:gap-4 mb-6">
           <Card className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-lg transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
             <CardContent className="px-1 py-2 text-center sm:p-4">
                <Shield className="h-4 w-4 text-blue-600 mx-auto mb-1 sm:h-5 sm:w-5 sm:mb-2" />
                <p className="text-xs text-muted-foreground">{t('stats.memberSince')}</p>
                  <p className="font-semibold text-foreground text-sm">
                  {displayUser.createdAt
  ? new Date(displayUser.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  : t('stats.new')}
                </p>
              </CardContent>
            </Card>
           <Card className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-lg transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
             <CardContent className="px-1 py-2 text-center sm:p-4">
                <Clock className="h-4 w-4 text-blue-600 mx-auto mb-1 sm:h-5 sm:w-5 sm:mb-2" />
                <p className="text-xs text-muted-foreground">{t('stats.account')}</p>
                <p className="font-semibold text-foreground text-sm">{t('stats.active')}</p>
              </CardContent>
            </Card>
           <Card className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-lg transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
              <CardContent className="px-1 py-2 text-center sm:p-4">
                <ShoppingBag className="h-4 w-4 text-blue-600 mx-auto mb-1 sm:h-5 sm:w-5 sm:mb-2" />
                <p className="text-xs text-muted-foreground">{isModerator ? t('stats.completed') : t('stats.orders')}</p>
                <p className="font-semibold text-foreground text-sm">{ordersCount !== null ? ordersCount : '...'}</p>
              </CardContent>
            </Card>
          </div>
        )}

         {/* Tabs - only show when viewing own profile */}
        {!isViewingOther && (
       <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('profile')}

    className={`flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
    activeTab === 'profile'
    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
    : 'border border-border/60 bg-white/45 dark:bg-black/35 backdrop-blur-xl text-muted-foreground hover:border-blue-500/30 hover:text-foreground'
      }`}
          >
            <User className="h-4 w-4" />{t('tabs.editProfile')}
          </button>
          <button
            onClick={() => setActiveTab('password')}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
          activeTab === 'password'
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
          : 'border border-border/60 bg-white/45 dark:bg-black/35 backdrop-blur-xl text-muted-foreground hover:border-blue-500/30 hover:text-foreground'
          }`}
          >
            <Lock className="h-4 w-4" />{t('tabs.changePassword')}
          </button>
          {!canAccessAdmin(user.role) && (
  <button
    onClick={() => setActiveTab('payments')}
    className={`flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
      activeTab === 'payments'
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
        : 'border border-border/60 bg-white/45 dark:bg-black/35 backdrop-blur-xl text-muted-foreground hover:border-blue-500/30 hover:text-foreground'
    }`}
  >
    <Receipt className="h-4 w-4" />
    {t('tabs.myPayments')}
  </button>
)}
        </div>
 )}
         {isViewingOther && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 sm:p-4 text-center">
                <Shield className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t('viewed.role')}</p>
                <p className="font-semibold text-foreground text-sm capitalize">{displayUser.role}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
             <CardContent className="p-3 sm:p-4 text-center">
                <Mail className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t('viewed.email')}</p>
                <p className="font-semibold text-foreground text-sm truncate">{displayUser.email}</p>
              </CardContent>
            </Card>
                 <Card className="border-0 shadow-sm">
             <CardContent className="p-3 sm:p-4 text-center">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t('viewed.lastSeen')}</p>
                <p className="font-semibold text-foreground text-sm">
                  {displayUser.lastSeen 
                    ? new Date(displayUser.lastSeen).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : t('viewed.never')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
         {/* Content - only show when viewing own profile */}
       {!isViewingOther && activeTab !== 'payments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'profile' ? (
          <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
           <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_40%)]" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600" />{t('tabs.editProfile')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"><User className="h-4 w-4 text-blue-600" />{t('form.fullName')}</label>
                      <input type="text" required className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"><Mail className="h-4 w-4 text-blue-600" />{t('form.email')}</label>
                      <input type="email" required className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <Button type="submit" disabled={saving} size="lg" className="w-full">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      {saving ? t('form.saving') : t('form.saveChanges')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
            ) : (
           <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
             <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_40%)]" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-blue-600" />{t('tabs.changePassword')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-5">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">{t('form.currentPassword')}</label>
                      <input type="password" required className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10" value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('form.newPassword')}</label>
                        <input type="password" required placeholder={t('form.passwordPlaceholder')} className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('form.confirmPassword')}</label>
                        <input type="password" required className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                      </div>
                    </div>
                    <Button type="submit" disabled={saving} size="lg" className="w-full">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                      {saving ? t('form.changing') : t('tabs.changePassword')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
              {!isViewingOther && isFounder && (
              <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-yellow-500/30 hover:shadow-[0_20px_60px_rgba(234,179,8,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,179,8,0.10),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_40%)]" />
                <CardContent className="p-6">
                  <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground text-center mb-4">{t('links.quickLinks')}</h3>
                  <div className="space-y-2">
                    <Link href="/admin">
                      <Button variant="outline" className="w-full justify-start rounded-xl border-border/60 transition-all hover:scale-[1.02]">
                        <LayoutDashboard className="mr-2 h-4 w-4" />{t('links.dashboard')}
                      </Button>
                    </Link>
                    <Link href="/admin">
                      <Button variant="outline" className="w-full justify-start rounded-xl border-border/60 transition-all hover:scale-[1.02]">
                        <Users className="mr-2 h-4 w-4" />{t('links.manageUsers')}
                      </Button>
                    </Link>
                    <Link href="/admin">
                      <Button variant="outline" className="w-full justify-start rounded-xl border-border/60 transition-all hover:scale-[1.02]">
                        <BarChart3 className="mr-2 h-4 w-4" />{t('links.allOrders')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
             {!isViewingOther && isModerator && (
             <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-[0_20px_60px_rgba(168,85,247,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.06),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_40%)]" />
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">{t('links.completedOrders')}</h3>
                  {ordersCount !== null && ordersCount > 0 ? (
                    <>
                     <p className="text-sm text-muted-foreground mb-4">
                     {ordersCount === 1
                     ? t('moderator.completedOrders', { count: ordersCount })
                    : t('moderator.completedOrdersPlural', { count: ordersCount })}
                     </p>
                      <Link href="/admin"><Button variant="outline" className="w-full rounded-xl transition-all hover:scale-[1.02]">{t('links.viewDashboard')}<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">{t('moderator.noCompletedOrders')}</p>
                      <Link href="/admin"><Button className="w-full rounded-xl bg-purple-600 text-white transition-all hover:scale-[1.02] hover:bg-purple-700">{t('links.goToDashboard')}<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
               {!isViewingOther && !isFounder && !isModerator && (
            <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_40%)]" />
                <CardContent className="p-6 text-center">
                  <Package className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">{t('links.yourOrders')}</h3>
                  {ordersCount !== null && ordersCount > 0 ? (
                    <>
                    <p className="text-sm text-muted-foreground mb-4">
                     {ordersCount === 1
                     ? t('stats.youHaveOrders', { count: ordersCount })
                    : t('stats.youHaveOrdersPlural', { count: ordersCount })}
                     </p>
                      <Link href="/my-orders"><Button variant="outline" className="w-full">{t('links.viewMyOrders')}<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">{t('student.noOrders')}</p>
                      <Link href="/orders"><Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">{t('links.placeFirstOrder')}<ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180" /></Button></Link>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
     )}
     {!isViewingOther && activeTab === 'payments' && !canAccessAdmin(user.role) && (
  <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-blue-600" />
        {t('tabs.myPayments')}
      </CardTitle>
    </CardHeader>

    <CardContent>
      {paymentHistory.length === 0 ? (
        <div className="py-12 text-center">
          <Receipt className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="font-semibold text-foreground">{t('payments.noPayments')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('payments.description')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paymentHistory.map((payment) => (
            <div
              key={`${payment.source}-${payment.id}`}
              className="rounded-2xl border border-border/50 bg-background/50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600">
                     {payment.source === 'manual'
                     ? t('payments.manualCrypto')
                    : t('payments.nowPayments')}
                    </span>

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        ['confirmed', 'finished', 'sending'].includes(payment.status)
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : payment.status === 'rejected' || payment.status === 'failed'
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                     {t(`payments.${payment.status}`)}
                    </span>

                    <span className="text-xs font-semibold text-muted-foreground">
                      {payment.type === 'deposit'
                      ? t('payments.deposit')
                      : t('payments.finalPayment')}
                    </span>
                  </div>

                  <p className="mt-2 font-semibold text-foreground">
                    {getServiceName(payment.service)}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(payment.date).toLocaleString()}
                  </p>

                  <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                    {payment.id}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-black text-emerald-600">
                    {payment.amount} {payment.currency}
                  </p>

                  {payment.link && (
                    <a
                      href={payment.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      {t('payments.viewDetails')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)}
      </div>
  </PremiumPageShell>
  )
}