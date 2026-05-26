'use client'
import { showToast } from '@/components/ui/toast'
import { useState, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { 
 ArrowRight,
 CheckCircle,
 Mail, 
 FileText,
 DollarSign,
 Sparkles,
 Package,Upload,
 X,
FileText as FileIcon,
FileImage,
FileArchive,
CheckCircle2,
LogIn,
ShieldCheck,
GraduationCap,
Globe,
Smartphone,
Presentation,
FileUser,
Languages,
Bug,
Bot,
Palette,
}
 from 'lucide-react'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/components/auth-context'
import PremiumPageShell from '@/components/PremiumPageShell'
import Link from 'next/link'

const services = {
  'graduation-projects': {
    name: 'Graduation Projects',
    range: '$250 - $1200',
    min: 250,
    max: 1200,
    delivery: '1–4 weeks',
    icon: GraduationCap,
    color: 'from-sky-500 to-cyan-500',
  },

  'academic-reports': {
    name: 'Academic Reports',
    range: '$40 - $250',
    min: 40,
    max: 250,
    delivery: '2–5 days',
    icon: FileText,
    color: 'from-pink-500 to-fuchsia-500',
  },

  'custom-websites': {
    name: 'Custom Websites',
    range: '$500 - $3,000',
    min: 500,
    max: 3000,
    delivery: '1–4 weeks',
    icon: Globe,
    color: 'from-emerald-500 to-teal-500',
  },

  'mobile-apps': {
    name: 'Mobile Apps',
    range: '$1000 - $8,000',
    min: 1000,
    max: 8000,
    delivery: '3–12 weeks',
    icon: Smartphone,
    color: 'from-orange-500 to-red-500',
  },

  'powerpoint-presentations': {
    name: 'PowerPoint Presentations',
    range: '$40 - $300',
    min: 40,
    max: 300,
    delivery: '1–3 days',
    icon: Presentation,
    color: 'from-rose-500 to-pink-500',
  },

  'cv-resume-writing': {
    name: 'CV/Resume Writing',
    range: '$30 - $120',
    min: 30,
    max: 120,
    delivery: '1–2 days',
    icon: FileUser,
    color: 'from-amber-500 to-yellow-500',
  },

  'translation': {
    name: 'Translation (En↔Ar)',
    range: '$15 - $200',
    min: 15,
    max: 200,
    delivery: '1–4 days',
    icon: Languages,
    color: 'from-violet-500 to-purple-500',
  },

  'code-debugging': {
    name: 'Code Debugging',
    range: '$50 - $500',
    min: 50,
    max: 500,
    delivery: '1–7 days',
    icon: Bug,
    color: 'from-cyan-500 to-blue-500',
  },

  'ai-automation': {
    name: 'AI Automation',
    range: '$300 - $5,000',
    min: 300,
    max: 5000,
    delivery: '1–8 weeks',
    icon: Bot,
    color: 'from-fuchsia-500 to-purple-500',
  },

  'ui-ux-design': {
    name: 'UI/UX Design',
    range: '$150 - $1500',
    min: 150,
    max: 1500,
    delivery: '3–10 days',
    icon: Palette,
    color: 'from-pink-500 to-rose-500',
  },
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    return <FileIcon className="h-4 w-4 text-red-500" />
  }

  if (['doc', 'docx'].includes(ext || '')) {
    return <FileIcon className="h-4 w-4 text-blue-500" />
  }

  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    return <FileImage className="h-4 w-4 text-cyan-500" />
  }

  if (ext === 'zip') {
    return <FileArchive className="h-4 w-4 text-amber-500" />
  }

  return <FileIcon className="h-4 w-4 text-slate-500" />
}
type ServiceKey = keyof typeof services
function OrderFormContent() {
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const serviceParam = searchParams.get('service')
const defaultService: ServiceKey =
  serviceParam && serviceParam in services
    ? (serviceParam as ServiceKey)
    : 'graduation-projects'

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

    const [formData, setFormData] = useState({
    service: defaultService,
    requirements: '',
    price: 0,
    priority: 'normal',
  })

  const selectedService = services[formData.service]
  

 const handleServiceChange = (service: ServiceKey) => {
    setFormData({
      ...formData,
      service,
      price: 0,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) {
  showToast('Please log in before placing an order.', 'error')
  return
}
    setLoading(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },

  body: JSON.stringify({
  service: formData.service,
  requirements: formData.requirements,
  price: formData.price,
  priority: formData.priority,
  deliveryEstimate: selectedService.delivery,
}),


      })

      const data = await response.json()

      if (data.success) {
        // Upload files if any
        if (files.length > 0) {
          for (const file of files) {
            const fileFormData = new FormData()
            fileFormData.append('file', file)
            fileFormData.append('orderId', data.orderId)
            
            await fetch('/api/upload', {
              method: 'POST',
              body: fileFormData,
            })
          }
        }

        showToast('Order submitted successfully! Check your email for confirmation.', 'success')
        setFiles([])
        setSubmitted(true)
      } else {
        showToast(data.error || 'Something went wrong. Please try again.', 'error')
      }
    } catch {
      showToast('Network error. Please check your connection and try again.', 'error')
    }

    setLoading(false)
  }

  if (submitted) {
    return (
  <PremiumPageShell className="pt-16 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full text-center py-12">
          <CardContent className="space-y-6">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Order Submitted!</h2>
             <p className="text-muted-foreground">
                We have received your request and will contact you at{' '}
               <strong>{user?.email || 'your verified email'}</strong>
              </p>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/track">
                <Button variant="outline">
                  <Package className="mr-2 h-4 w-4" />
                  Track Your Order
                </Button>
              </Link>
                <Button
                onClick={() => {
                  setSubmitted(false)
                  setFormData({
                    service: defaultService,
                    requirements: '',
                    price: 0,
                    priority: 'normal',
                  })
                }}
              >
                Place Another Order
              </Button>

            </div>
          </CardContent>
        </Card>
      </PremiumPageShell>
    
    )
  }
if (authLoading) {
  return (
    <PremiumPageShell className="pt-24 py-16 px-4">
      <div className="mx-auto max-w-4xl">
        <CardSkeleton />
      </div>
    </PremiumPageShell>
  )
}

if (!user) {
  return (
    <PremiumPageShell className="flex min-h-screen items-center justify-center px-4 py-24">
      <Card className="w-full max-w-lg rounded-3xl border-border/50 bg-background/70 shadow-2xl backdrop-blur-2xl">
        <CardContent className="px-6 py-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10">
            <ShieldCheck className="h-8 w-8 text-blue-500" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Login required
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Please sign in with a verified Codnexia account before placing an order. This keeps your order, chat, files, payments, and email updates linked to the correct account.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href="/login">
              <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </Button>
            </Link>

            <Link href="/register">
              <Button variant="outline" className="w-full">
                Create account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </PremiumPageShell>
  )
}
  return (
  <PremiumPageShell className="pt-24 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
            {['Select Service', 'Fill Details', 'Submit Request'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  i <= 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {i + 1}
              </div>
             <span className="text-sm text-muted-foreground hidden sm:block">{step}</span>
              {i < 2 && <div className="w-8 h-px bg-slate-200 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Fast & Reliable Service
          </div>
         <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Place Your Order
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Fill in the details below and we will start working on your project right away
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
          <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-card/75 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.15)] dark:bg-card/60 dark:hover:shadow-[0_20px_60px_rgba(37,99,235,0.25)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Project Details
                </CardTitle>
              </CardHeader>

              
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                   <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      Your Email
                    </label>

                   <input
                 type="email"
                 required
                 readOnly
                 placeholder="student@example.com"
                 className="w-full cursor-not-allowed rounded-xl border-2 border-border/50 bg-muted/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm"
                 value={user.email}
                    />

                  <p className="text-xs text-muted-foreground mt-1">
                    Orders are linked to your verified account email.
                   </p>
                  </div>

                  {/* Service Selection */}
                  <div>
                   <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Select Service
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   {Object.entries(services).map(([key, service]) => {
                      const serviceKey = key as ServiceKey
                          const Icon = service.icon
                            return (
                        <button
                         key={serviceKey}
                          type="button"
                          onClick={() => handleServiceChange(serviceKey)}
                           className={`group text-left px-4 py-3 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] ${
                             formData.service === serviceKey
                            ? 'border-blue-600 bg-blue-500/10 shadow-[0_8px_30px_rgba(37,99,235,0.18)] dark:bg-blue-950/50'
                            : 'border-border/50 bg-background/40 hover:border-blue-500/40 hover:bg-blue-500/5 hover:shadow-[0_8px_24px_rgba(37,99,235,0.10)]'
                          }`}
                        >
                       <div className="flex items-center justify-between gap-3">
  <div className="flex items-center gap-3">
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${service.color}`}>
      <Icon className="h-4 w-4 text-white" />
    </div>

    <p className="font-semibold text-foreground">
      {service.name}
    </p>
  </div>

  {formData.service === key && (
    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500" />
  )}
</div>


                        </button>
                        )
                     })}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                   <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Project Requirements
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Describe your project, deadline, and any specific requirements..."
                     className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 resize-none"                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    />
                    <div className="flex justify-between items-center mt-1">
                     <span className="text-xs text-muted-foreground">
                        {formData.requirements.length < 20
                          ? 'Please provide more details'
                          : formData.requirements.length < 100
                          ? 'Add more detail for better results'
                          : 'Great detail! We know exactly what you need'}
                      </span>
                     <span className="text-xs text-muted-foreground">
                        {formData.requirements.length} characters
                      </span>
                    </div>
                  </div>
                   {/* Priority Selection */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Priority Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'low', label: 'Low', icon: '🔥' },
                        { value: 'normal', label: 'Normal', icon: '🔥🔥' },
                        { value: 'urgent', label: 'Urgent', icon: '🔥🔥🔥' },
                      ].map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: p.value })}
                          className={`text-center p-3 rounded-lg border-2 transition-all ${
                            formData.priority === p.value
                              ? p.value === 'urgent' 
                                ? 'border-red-400 bg-red-50 dark:bg-red-950/30 shadow-md' 
                                : p.value === 'normal'
                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-md'
                                : 'border-slate-400 bg-slate-50 dark:bg-slate-800 shadow-md'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          <p className="text-lg mb-1">{p.icon}</p>
                          <p className="font-semibold text-sm text-foreground">{p.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* File Upload */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <Upload className="h-4 w-4 text-blue-600" />
                      Attach Files (Optional)
                    </label>
                    <div className="mb-3 flex items-center justify-between rounded-xl border border-blue-500/15 bg-blue-500/5 px-3 py-2 text-xs">
  <span className="font-medium text-muted-foreground">
    Files attached
  </span>

  <span className="font-bold text-blue-600 dark:text-blue-300">
    {files.length}/5
  </span>
</div>
                    {files.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {files.map((file, index) => (
                          <div 
                          key={index} 
                          className="group flex items-center justify-between rounded-xl border border-border/40 bg-background/50 px-3 py-2 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/30 hover:bg-background/80 hover:shadow-[0_8px_24px_rgba(37,99,235,0.10)]">
                            <div className="flex items-center gap-2">
                             {file.type.startsWith('image/') ? (
  <div className="h-9 w-9 overflow-hidden rounded-lg border border-border/40 bg-background/60">
<Image
  src={URL.createObjectURL(file)}
  alt={file.name}
  width={36}
  height={36}
  className="h-full w-full object-cover"
/>
  </div>
) : (
  getFileIcon(file.name)
)}
                              <span className="text-sm text-foreground truncate max-w-[200px]">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                
                                ({(file.size / 1024 / 1024).toFixed(1)}MB)
                              </span>
                              <span className="hidden items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300 sm:inline-flex">
                               <CheckCircle2 className="h-3 w-3" />
                                Uploaded
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFiles(files.filter((_, i) => i !== index))}
                              className="rounded-lg p-1 text-muted-foreground transition-all duration-300 hover:bg-red-500/10 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {files.length < 5 && (
             <button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  onDragOver={(e) => {
    e.preventDefault()
    e.currentTarget.classList.add(
      'border-blue-500',
      'bg-blue-500/10',
      'shadow-[0_0_40px_rgba(37,99,235,0.18)]',
      'scale-[1.01]'
    )
  }}
  onDragLeave={(e) => {
    e.currentTarget.classList.remove(
      'border-blue-500',
      'bg-blue-500/10',
      'shadow-[0_0_40px_rgba(37,99,235,0.18)]',
      'scale-[1.01]'
    )
  }}
  onDrop={(e) => {
    e.preventDefault()

    e.currentTarget.classList.remove(
      'border-blue-500',
      'bg-blue-500/10',
      'shadow-[0_0_40px_rgba(37,99,235,0.18)]',
      'scale-[1.01]'
    )

    const droppedFiles = Array.from(e.dataTransfer.files || [])

    const validFiles = droppedFiles.filter(
      (f) => f.size <= 10 * 1024 * 1024
    )

    if (validFiles.length + files.length > 5) {
      showToast('Maximum 5 files per order', 'warning')
      return
    }

    if (validFiles.length !== droppedFiles.length) {
      showToast('Some files were too large (max 10MB)', 'warning')
    }

    setFiles([...files, ...validFiles])
  }}
  className="group relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-border/60 bg-background/30 p-6 text-center backdrop-blur-xl transition-all duration-300 hover:border-blue-400 hover:bg-blue-500/5 hover:shadow-[0_0_30px_rgba(37,99,235,0.12)]"
>
  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-400/5 to-purple-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

<div className="relative mx-auto mb-3 flex h-12 w-12 items-center justify-center">
  <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl transition-all duration-500 group-hover:bg-blue-500/20" />

  <Upload className="relative h-7 w-7 text-blue-400 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110" />
</div>

  <p className="text-sm font-medium text-foreground">
    Drag & drop files here
  </p>

  <p className="mt-1 text-sm text-muted-foreground">
    or click to browse files
  </p>

  <p className="mt-2 text-xs text-muted-foreground">
    PDF, DOCX, JPG, PNG, ZIP • Max 10MB each
  </p>
</button>

                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.zip"
                      onChange={(e) => {
                        const selectedFiles = Array.from(e.target.files || [])
                        const validFiles = selectedFiles.filter((f) => f.size <= 10 * 1024 * 1024)
                        if (validFiles.length + files.length > 5) {
                          showToast('Maximum 5 files per order', 'warning')
                          return
                        }
                        if (validFiles.length !== selectedFiles.length) {
                          showToast('Some files were too large (max 10MB)', 'warning')
                        }
                        setFiles([...files, ...validFiles])
                      }}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                   className="w-full bg-blue-600 py-6 text-lg font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Submit Order
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
<Card className="group relative overflow-hidden rounded-3xl border-2 border-blue-500/20 bg-white/35 text-foreground backdrop-blur-2xl shadow-[0_20px_60px_rgba(37,99,235,0.12)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-white/45 hover:shadow-[0_24px_70px_rgba(37,99,235,0.20)] dark:border-blue-400/20 dark:bg-slate-950/70 dark:text-white dark:shadow-[0_20px_60px_rgba(37,99,235,0.16)] dark:hover:border-blue-400/35 dark:hover:bg-slate-950/85 dark:hover:shadow-[0_24px_70px_rgba(37,99,235,0.25)]">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-blue-400" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border/50 dark:border-white/10">
                   <span className="text-muted-foreground dark:text-white/60">Service</span>
                    <span className="font-semibold">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/50 dark:border-white/10">
                   <span className="text-muted-foreground dark:text-white/60">Price</span>
                    <span
                      className="text-2xl font-bold text-blue-400 animate-in fade-in duration-300"
                    >
                      {selectedService.range}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/50 dark:border-white/10">
                  <span className="text-muted-foreground dark:text-white/60">Estimated Timeline</span>
                   <span className="text-green-400 text-sm text-right">
                     {selectedService.delivery}
                      </span>
                  </div>
                  <div className="pt-2 text-sm text-muted-foreground space-y-2">
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                     Revision Support Included
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                       Secure & Confidential
                    </p>
                     <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                       Fast Delivery
                    </p>
                      <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                       Fast Response Time
                    </p> 
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
  </PremiumPageShell>
  )
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
     <PremiumPageShell className="py-18 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Skeleton className="h-8 w-64 mx-auto mb-4" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <CardSkeleton />
              </div>
              <div>
                <CardSkeleton />
              </div>
            </div>
          </div>
       </PremiumPageShell>
      }
    >
      <OrderFormContent />
    </Suspense>
  )
}