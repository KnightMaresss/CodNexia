'use client'
import { showToast } from '@/components/ui/toast'
import { useState, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useTranslations,useLocale } from 'next-intl'
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
ArrowLeft
}
 from 'lucide-react'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/components/auth-context'
import PremiumPageShell from '@/components/PremiumPageShell'
import { Link } from '@/i18n/navigation'



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
const serviceKeys = [
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

type ServiceKey = typeof serviceKeys[number]
function OrderFormContent() {
  const t = useTranslations('Orders')
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const services = {
  
  'graduation-projects': {
   name: t('services.graduationProjects.name'),
    range: '$250 - $1200',
    min: 250,
    max: 1200,
    delivery: t('delivery.weeks1to4'),
    icon: GraduationCap,
    color: 'from-sky-500 to-cyan-500',
  },

  'academic-reports': {
    name: t('services.academicReports.name'),
    range: '$40 - $250',
    min: 40,
    max: 250,
    delivery: t('delivery.days2to5'),
    icon: FileText,
    color: 'from-pink-500 to-fuchsia-500',
  },

  'custom-websites': {
    name: t('services.customWebsites.name'),
    range: '$500 - $3,000',
    min: 500,
    max: 3000,
    delivery: t('delivery.weeks1to4'),
    icon: Globe,
    color: 'from-emerald-500 to-teal-500',
  },

  'mobile-apps': {
    name: t('services.mobileApps.name'),
    range: '$1000 - $8,000',
    min: 1000,
    max: 8000,
    delivery: t('delivery.weeks3to12'),
    icon: Smartphone,
    color: 'from-orange-500 to-red-500',
  },

  'powerpoint-presentations': {
    name: t('services.powerpoint.name'),
    range: '$40 - $300',
    min: 40,
    max: 300,
    delivery: t('delivery.days1to3'),
    icon: Presentation,
    color: 'from-rose-500 to-pink-500',
  },

  'cv-resume-writing': {
    name: t('services.cv.name'),
    range: '$30 - $120',
    min: 30,
    max: 120,
    delivery: t('delivery.days1to2'),
    icon: FileUser,
    color: 'from-amber-500 to-yellow-500',
  },

  'translation': {
    name: t('services.translation.name'),
    range: '$15 - $200',
    min: 15,
    max: 200,
    delivery: t('delivery.days1to4'),
    icon: Languages,
    color: 'from-violet-500 to-purple-500',
  },

  'code-debugging': {
    name: t('services.debugging.name'),
    range: '$50 - $500',
    min: 50,
    max: 500,
    delivery: t('delivery.days1to7'),
    icon: Bug,
    color: 'from-cyan-500 to-blue-500',
  },

  'ai-automation': {
    name: t('services.ai.name'),
    range: '$300 - $5,000',
    min: 300,
    max: 5000,
    delivery: t('delivery.weeks1to8'),
    icon: Bot,
    color: 'from-fuchsia-500 to-purple-500',
  },

  'ui-ux-design': {
    name: t('services.uiux.name'),
    range: '$150 - $1500',
    min: 150,
    max: 1500,
    delivery: t('delivery.days3to10'),
    icon: Palette,
    color: 'from-pink-500 to-rose-500',
  },
}
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileInstance>(null)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const serviceParam = searchParams.get('service')
  const defaultService: ServiceKey =
  serviceParam && serviceKeys.includes(serviceParam as ServiceKey)
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
    if (!turnstileToken) {
  showToast('Please complete the human verification.', 'error')
  return
}
    if (!user?.email) {
    showToast(t('messages.loginRequired'), 'error')
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
  turnstileToken,
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

        showToast(t('messages.success'), 'success')
        setFiles([])
        setSubmitted(true)
      } else {
        showToast(data.error || t('messages.error'), 'error')
        setTurnstileToken('')
        turnstileRef.current?.reset()
      }
    } catch {
      showToast(t('messages.network'), 'error')
      setTurnstileToken('')
      turnstileRef.current?.reset()
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
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('success.title')}</h2>
             <p className="text-muted-foreground">
                {t('success.description')}{' '}
               <strong>{user?.email || t('success.emailFallback')}</strong>
              </p>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/track">
                <Button variant="outline">
                  <Package className="mr-2 h-4 w-4" />
                  {t('success.track')}
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
                {t('success.another')}
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
            {t('auth.title')}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
           {t('auth.description')}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href="/login">
              <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                <LogIn className="mr-2 h-4 w-4" />
               {t('auth.signin')}
              </Button>
            </Link>

            <Link href="/register">
              <Button variant="outline" className="w-full">
               {t('auth.create')}
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
            {[
  t('steps.select'),
  t('steps.details'),
  t('steps.submit'),
].map((step, i) => (
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
            {t('badge')}
          </div>
         <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
          <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-card/75 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.15)] dark:bg-card/60 dark:hover:shadow-[0_20px_60px_rgba(37,99,235,0.25)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {t('form.projectDetails')}
                </CardTitle>
              </CardHeader>

              
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                   <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      {t('form.yourEmail')}
                    </label>

                   <input
                 type="email"
                 required
                 readOnly
                 placeholder="client@example.com"
                 className="w-full cursor-not-allowed rounded-xl border-2 border-border/50 bg-muted/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm"
                 value={user.email}
                    />

                  <p className="text-xs text-muted-foreground mt-1">
                    {t('form.emailNote')}
                   </p>
                  </div>

                  {/* Service Selection */}
                  <div>
                   <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      {t('form.selectService')}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   {serviceKeys.map((serviceKey) => {
  const service = services[serviceKey]
                      
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

  {formData.service === serviceKey && (
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
                      {t('form.projectRequirements')}
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder={t('form.requirementsPlaceholder')}
                     className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 resize-none"                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    />
                    <div className="flex justify-between items-center mt-1">
                     <span className="text-xs text-muted-foreground">
                        {formData.requirements.length < 20
                          ? t('requirements.short')
                          : formData.requirements.length < 100
                          ? t('requirements.medium')
                          : t('requirements.good')}         
                      </span>
                     <span className="text-xs text-muted-foreground">
                        {formData.requirements.length} {t('requirements.characters')}
                      </span>
                    </div>
                  </div>
                   {/* Priority Selection */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      {t('form.priorityLevel')}
                    </label>
                   <div className="grid grid-cols-3 gap-1.5">
                    {[
  { value: 'low', label: t('priority.low'), icon: '🔥' },
  { value: 'normal', label: t('priority.normal'), icon: '🔥🔥' },
  { value: 'urgent', label: t('priority.urgent'), icon: '🔥🔥🔥' },
].map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: p.value })}
                           className={`min-w-0 text-center px-1 py-3 rounded-lg border-2 transition-all ${
                            formData.priority === p.value
                              ? p.value === 'urgent' 
                                ? 'border-red-400 bg-red-50 dark:bg-red-950/30 shadow-md' 
                                : p.value === 'normal'
                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-md'
                                : 'border-slate-400 bg-slate-50 dark:bg-slate-800 shadow-md'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                         <p className="text-base mb-1 leading-none">{p.icon}</p>
                         <p className="text-[11px] font-semibold leading-tight text-foreground sm:text-sm">
                        {p.label}
                         </p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* File Upload */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <Upload className="h-4 w-4 text-blue-600" />
                      {t('form.attachFiles')}
                    </label>
                    <div className="mb-3 flex items-center justify-between rounded-xl border border-blue-500/15 bg-blue-500/5 px-3 py-2 text-xs">
  <span className="font-medium text-muted-foreground">
    {t('upload.filesAttached')}
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
                                {t('upload.uploaded')}
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
      showToast(t('messages.maxFiles'), 'warning')
      return
    }

    if (validFiles.length !== droppedFiles.length) {
      showToast(t('messages.fileTooLarge'), 'warning')
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
    {t('upload.dragDrop')}
  </p>

  <p className="mt-1 text-sm text-muted-foreground">
    {t('upload.browse')}
  </p>

  <p className="mt-2 text-xs text-muted-foreground">
    {t('upload.supported')}
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
                          showToast(t('messages.maxFiles'), 'warning')
                          return
                        }
                        if (validFiles.length !== selectedFiles.length) {
                          showToast(t('messages.fileTooLarge'), 'warning')
                        }
                        setFiles([...files, ...validFiles])
                      }}
                    />
                  </div>
    <div className="flex justify-center">
<div className="flex justify-center scale-90 sm:scale-100 origin-center">
<Turnstile
  ref={turnstileRef}
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
  options={{
    size: 'flexible',
    theme: 'dark',
  }}
  onSuccess={setTurnstileToken}
  onError={() => setTurnstileToken('')}
  onExpire={() => setTurnstileToken('')}
/>
</div>
</div>
                  <Button
                    type="submit"
                    disabled={loading || !turnstileToken}
                    size="lg"
                   className="w-full bg-blue-600 py-6 text-lg font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30"
                  >
                   {loading ? (
    <span className="flex items-center gap-2">
    <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
    {t('buttons.submitting')}
  </span>
) : (
  <span className="flex items-center gap-2">
    {t('buttons.submit')}

    {isRTL ? (
      <ArrowLeft className="h-5 w-5" />
    ) : (
      <ArrowRight className="h-5 w-5" />
    )}
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
                    {t('summary.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border/50 dark:border-white/10">
                   <span className="text-muted-foreground dark:text-white/60">{t('summary.service')}</span>
                    <span className="font-semibold">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/50 dark:border-white/10">
                   <span className="text-muted-foreground dark:text-white/60">{t('summary.price')}</span>
                    <span
                      className="text-2xl font-bold text-blue-400 animate-in fade-in duration-300"
                    >
                      {selectedService.range}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/50 dark:border-white/10">
                  <span className="text-muted-foreground dark:text-white/60">{t('summary.timeline')}</span>
                   <span className="text-green-400 text-sm text-right">
                     {selectedService.delivery}
                      </span>
                  </div>
                  <div className="pt-2 text-sm text-muted-foreground space-y-2">
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                     {t('features.revision')}
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      {t('features.secure')}
                    </p>
                     <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                     {t('features.delivery')}
                    </p>
                      <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                     {t('features.response')}
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