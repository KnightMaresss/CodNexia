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
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/components/auth-context'
import { useRouter } from 'next/navigation'
import PremiumPageShell from '@/components/PremiumPageShell'
export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewedUser, setViewedUser] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    myOrders: 0,
    myCompleted: 0,
    myRating: 0,
    modCount: 0,
  })
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
        showToast('Profile updated successfully!', 'success')
        refreshUser()
      } else {
        showToast(data.error || 'Update failed', 'error')
      }
    } catch {
      showToast('Something went wrong', 'error')
    }
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    if (formData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
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
        showToast('Password changed successfully!', 'success')
        setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      } else {
        showToast(data.error || 'Failed to change password', 'error')
      }
    } catch {
      showToast('Something went wrong', 'error')
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
        showToast('Profile picture updated!', 'success')
        refreshUser()
      } else {
        showToast(data.error || 'Upload failed', 'error')
      }
    } catch {
      showToast('Upload failed', 'error')
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

  return (
    <PremiumPageShell className="pt-24 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative group inline-block">
            <div className={`w-28 h-28 rounded-full ring-4 ${isFounder ? 'ring-yellow-400' : 'ring-muted'} bg-muted flex items-center justify-center overflow-hidden mx-auto transition-all duration-300 group-hover:scale-105`}>
                {displayUser.profilePic ? (
                 <Image 
                  src={displayUser.profilePic} 
                  alt="Profile" 
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
          <p className="text-muted-foreground flex items-center gap-1 justify-center">
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
                  <p className="text-xs text-muted-foreground">All Orders</p>
                </CardContent>
              </Card>
          <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-600">${stats.totalRevenue}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </CardContent>
              </Card>
            <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
                </CardContent>
              </Card>
            <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <Shield className="h-5 w-5 text-indigo-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.modCount}</p>
                  <p className="text-xs text-muted-foreground">Moderators</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-yellow-500/30 hover:shadow-[0_20px_60px_rgba(234,179,8,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <Crown className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{stats.myOrders}</p>
                  <p className="text-xs text-muted-foreground">My Orders</p>
                </CardContent>
              </Card>
             <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-yellow-500/30 hover:shadow-[0_20px_60px_rgba(234,179,8,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{stats.myCompleted}</p>
                  <p className="text-xs text-muted-foreground">My Completed</p>
                </CardContent>
              </Card>
             <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-yellow-500/30 hover:shadow-[0_20px_60px_rgba(234,179,8,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <Star className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-500">{stats.myRating || '—'}</p>
                  <p className="text-xs text-muted-foreground">My Rating</p>
                </CardContent>
              </Card>
             <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-yellow-500/30 hover:shadow-[0_20px_60px_rgba(234,179,8,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
                <CardContent className="p-4 text-center">
                  <Clock className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-blue-600">Active</p>
                  <p className="text-xs text-muted-foreground">Account</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Non-founder Stats Row */}
        {!isFounder && (
          <div className="grid grid-cols-3 gap-4 mb-8">
           <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
              <CardContent className="p-4 text-center">
                <Shield className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Member since</p>
                  <p className="font-semibold text-foreground text-sm">
                  {displayUser.createdAt ? new Date(displayUser.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'New'}
                </p>
              </CardContent>
            </Card>
           <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Account</p>
                <p className="font-semibold text-foreground text-sm">Active</p>
              </CardContent>
            </Card>
           <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
              <CardContent className="p-4 text-center">
                <ShoppingBag className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{isModerator ? 'Completed' : 'Orders'}</p>
                <p className="font-semibold text-foreground text-sm">{ordersCount !== null ? ordersCount : '...'}</p>
              </CardContent>
            </Card>
          </div>
        )}

         {/* Tabs - only show when viewing own profile */}
        {!isViewingOther && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('profile')}

    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
    activeTab === 'profile'
    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
    : 'border border-border/60 bg-white/45 dark:bg-black/35 backdrop-blur-xl text-muted-foreground hover:border-blue-500/30 hover:text-foreground'
      }`}
          >
            <User className="h-4 w-4" />Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
          activeTab === 'password'
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
          : 'border border-border/60 bg-white/45 dark:bg-black/35 backdrop-blur-xl text-muted-foreground hover:border-blue-500/30 hover:text-foreground'
          }`}
          >
            <Lock className="h-4 w-4" />Change Password
          </button>
        </div>
 )}
         {isViewingOther && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <Shield className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-semibold text-foreground text-sm capitalize">{displayUser.role}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <Mail className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-semibold text-foreground text-sm truncate">{displayUser.email}</p>
              </CardContent>
            </Card>
                 <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Last Seen</p>
                <p className="font-semibold text-foreground text-sm">
                  {displayUser.lastSeen 
                    ? new Date(displayUser.lastSeen).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : 'Never'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
         {/* Content - only show when viewing own profile */}
        {!isViewingOther && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'profile' ? (
          <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
           <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_40%)]" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600" />Edit Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"><User className="h-4 w-4 text-blue-600" />Full Name</label>
                      <input type="text" required className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"><Mail className="h-4 w-4 text-blue-600" />Email</label>
                      <input type="email" required className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <Button type="submit" disabled={saving} size="lg" className="w-full">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
            ) : (
           <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
             <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_40%)]" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-blue-600" />Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-5">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Current Password</label>
                      <input type="password" required className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10" value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">New Password</label>
                        <input type="password" required placeholder="Min. 6 characters" className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Confirm Password</label>
                        <input type="password" required className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                      </div>
                    </div>
                    <Button type="submit" disabled={saving} size="lg" className="w-full">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                      {saving ? 'Changing...' : 'Change Password'}
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
                  <h3 className="font-semibold text-foreground text-center mb-4">Quick Links</h3>
                  <div className="space-y-2">
                    <Link href="/admin">
                      <Button variant="outline" className="w-full justify-start rounded-xl border-border/60 transition-all hover:scale-[1.02]">
                        <LayoutDashboard className="mr-2 h-4 w-4" />Dashboard
                      </Button>
                    </Link>
                    <Link href="/admin">
                      <Button variant="outline" className="w-full justify-start rounded-xl border-border/60 transition-all hover:scale-[1.02]">
                        <Users className="mr-2 h-4 w-4" />Manage Users
                      </Button>
                    </Link>
                    <Link href="/admin">
                      <Button variant="outline" className="w-full justify-start rounded-xl border-border/60 transition-all hover:scale-[1.02]">
                        <BarChart3 className="mr-2 h-4 w-4" />All Orders
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
                  <h3 className="font-semibold text-foreground mb-1">Completed Orders</h3>
                  {ordersCount !== null && ordersCount > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">You have completed {ordersCount} order{ordersCount > 1 ? 's' : ''}</p>
                      <Link href="/admin"><Button variant="outline" className="w-full rounded-xl transition-all hover:scale-[1.02]">View Dashboard<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">No completed orders yet.</p>
                      <Link href="/admin"><Button className="w-full rounded-xl bg-purple-600 text-white transition-all hover:scale-[1.02] hover:bg-purple-700">Go to Dashboard<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
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
                  <h3 className="font-semibold text-foreground mb-1">Your Orders</h3>
                  {ordersCount !== null && ordersCount > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">You have {ordersCount} order{ordersCount > 1 ? 's' : ''}</p>
                      <Link href="/my-orders"><Button variant="outline" className="w-full">View My Orders<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">No orders yet.</p>
                      <Link href="/orders"><Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Place Your First Order<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
     )}
      </div>
  </PremiumPageShell>
  )
}