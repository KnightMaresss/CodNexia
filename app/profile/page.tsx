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
    return (
      <main className="min-h-screen pt-24 py-12 px-4 bg-gradient-to-br from-background to-muted">
        <div className="max-w-5xl mx-auto">
          {/* Profile header skeleton */}
          <div className="text-center mb-8">
            <div className="w-28 h-28 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 animate-pulse" />
            <div className="w-40 h-7 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto mb-2 animate-pulse" />
            <div className="w-56 h-4 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto animate-pulse" />
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-4 shadow-sm border border-border animate-pulse">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2" />
                <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
              </div>
            ))}
          </div>
          {/* Form skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border animate-pulse">
                <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="w-full h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="w-full h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  </div>
                  <div className="w-full h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>
              </div>
            </div>
            {/* Sidebar skeleton */}
            <div>
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border animate-pulse">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />
                <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-2" />
                <div className="w-32 h-3 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-4" />
                <div className="w-full h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!user) return null
  const displayUser = viewedUser || user
  const isViewingOther = !!viewedUser
 const isFounder = isFounderRole(displayUser.role)
const isModerator = isModeratorRole(displayUser.role)

  return (
    <main className="min-h-screen pt-24 py-12 px-4 bg-gradient-to-br from-background to-muted">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative group inline-block">
            <div className={`w-28 h-28 rounded-full ring-4 ${isFounder ? 'ring-yellow-400' : 'ring-muted'} bg-muted flex items-center justify-center overflow-hidden mx-auto`}>
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
          <h1 className="text-2xl font-bold text-foreground mt-4 flex items-center justify-center gap-2">
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
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <Package className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">All Orders</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-600">${stats.totalRevenue}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <Shield className="h-5 w-5 text-indigo-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.modCount}</p>
                  <p className="text-xs text-muted-foreground">Moderators</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-0 shadow-sm bg-yellow-50 dark:bg-yellow-900/20">
                <CardContent className="p-4 text-center">
                  <Crown className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{stats.myOrders}</p>
                  <p className="text-xs text-muted-foreground">My Orders</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-900/20">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{stats.myCompleted}</p>
                  <p className="text-xs text-muted-foreground">My Completed</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-orange-50 dark:bg-orange-900/20">
                <CardContent className="p-4 text-center">
                  <Star className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-500">{stats.myRating || '—'}</p>
                  <p className="text-xs text-muted-foreground">My Rating</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-900/20">
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
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <Shield className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Member since</p>
                  <p className="font-semibold text-foreground text-sm">
                  {displayUser.createdAt ? new Date(displayUser.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'New'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Account</p>
                <p className="font-semibold text-foreground text-sm">Active</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
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

            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'bg-card text-foreground border border-border hover:bg-muted'}`}
          >
            <User className="h-4 w-4" />Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'password' ? 'bg-blue-600 text-white shadow-md' : 'bg-card text-foreground border border-border hover:bg-muted'}`}
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
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600" />Edit Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"><User className="h-4 w-4 text-blue-600" />Full Name</label>
                      <input type="text" required className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"><Mail className="h-4 w-4 text-blue-600" />Email</label>
                      <input type="email" required className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <Button type="submit" disabled={saving} size="lg" className="w-full">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
            ) : (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-blue-600" />Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-5">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Current Password</label>
                      <input type="password" required className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">New Password</label>
                        <input type="password" required placeholder="Min. 6 characters" className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Confirm Password</label>
                        <input type="password" required className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
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
              <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                <CardContent className="p-6">
                  <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground text-center mb-4">Quick Links</h3>
                  <div className="space-y-2">
                    <Link href="/admin">
                      <Button variant="outline" className="w-full justify-start">
                        <LayoutDashboard className="mr-2 h-4 w-4" />Dashboard
                      </Button>
                    </Link>
                    <Link href="/admin">
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="mr-2 h-4 w-4" />Manage Users
                      </Button>
                    </Link>
                    <Link href="/admin">
                      <Button variant="outline" className="w-full justify-start">
                        <BarChart3 className="mr-2 h-4 w-4" />All Orders
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
             {!isViewingOther && isModerator && (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">Completed Orders</h3>
                  {ordersCount !== null && ordersCount > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">You have completed {ordersCount} order{ordersCount > 1 ? 's' : ''}</p>
                      <Link href="/admin"><Button variant="outline" className="w-full">View Dashboard<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">No completed orders yet.</p>
                      <Link href="/admin"><Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Go to Dashboard<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
               {!isViewingOther && !isFounder && !isModerator && (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
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
    </main>
  )
}