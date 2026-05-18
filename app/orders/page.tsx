'use client'
import { showToast } from '@/components/ui/toast'
import { useState, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, CheckCircle, Mail, FileText, DollarSign, Sparkles,Package,Upload, X, FileText as FileIcon } from 'lucide-react'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/components/auth-context'
import Link from 'next/link'

const services: Record<string, { name: string; range: string; min: number; max: number; description: string }> = {
  'graduation-projects': { name: 'Graduation Projects', range: '$150 - $400', min: 150, max: 400, description: 'Complete thesis, documentation & presentation' },
  'academic-reports': { name: 'Academic Reports', range: '$50 - $200', min: 50, max: 200, description: 'Research papers, essays & literature reviews' },
  'custom-websites': { name: 'Custom Websites', range: '$400 - $1,000', min: 400, max: 1000, description: 'Professional portfolio or business websites' },
  'mobile-apps': { name: 'Mobile Apps', range: '$500 - $1,500', min: 500, max: 1500, description: 'iOS/Android apps for student projects' },
  'powerpoint-presentations': { name: 'PowerPoint Presentations', range: '$30 - $100', min: 30, max: 100, description: 'Professional slides for thesis defense & class projects' },
  'cv-resume-writing': { name: 'CV/Resume Writing', range: '$50 - $150', min: 50, max: 150, description: 'Professional CV for fresh graduates with ATS optimization' },
  'translation': { name: 'Translation (En↔Ar)', range: '$20 - $80', min: 20, max: 80, description: 'Academic document translation — human, no AI used' },
  'code-debugging': { name: 'Code Debugging', range: '$50 - $300', min: 50, max: 300, description: 'Fix bugs, review & optimize your code projects' },
}

function OrderFormContent() {
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const serviceParam = searchParams.get('service')
  const defaultService = serviceParam && services[serviceParam] ? serviceParam : 'graduation-projects'

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

    const [formData, setFormData] = useState({
    studentEmail: user?.email || '',
    service: defaultService,
    requirements: '',
    price: 0,
    priority: 'normal',
  })

  const selectedService = services[formData.service]

  const deliveryFrom = new Date()
  deliveryFrom.setDate(deliveryFrom.getDate() + 3)
  const deliveryTo = new Date()
  deliveryTo.setDate(deliveryTo.getDate() + 7)

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const handleServiceChange = (service: string) => {
    setFormData({
      ...formData,
      service,
      price: 0,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
     <main className="min-h-screen pt-16 flex items-center justify-center px-4 bg-gradient-to-br from-background to-muted">
        <Card className="max-w-lg w-full text-center py-12">
          <CardContent className="space-y-6">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Order Submitted!</h2>
             <p className="text-muted-foreground">
                We have received your request and will contact you at{' '}
                <strong>{formData.studentEmail}</strong> within 24 hours.
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
                    studentEmail: user?.email || '',
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
      </main>
    )
  }

  return (
   <main className="min-h-screen pt-24 py-16 px-4 bg-gradient-to-br from-background to-muted">
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
           <Card className="overflow-hidden border border-border/60 bg-card shadow-xl transition-all hover:border-blue-500/30 hover:shadow-2xl">
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
                      placeholder="student@example.com"
                      className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={formData.studentEmail}
                      onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      We will send your order confirmation to this email
                    </p>
                  </div>

                  {/* Service Selection */}
                  <div>
                   <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Select Service
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(services).map(([key, { name, range }]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleServiceChange(key)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                            formData.service === key
                             ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 shadow-md'
                           : 'border-border bg-background/40 hover:border-blue-500/40 hover:bg-blue-500/5'
                          }`}
                        >
                          <p className="font-semibold text-foreground">{name}</p>
                          <p className="text-blue-600 font-bold mt-1">{range}</p>
                        </button>
                      ))}
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
                      className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      value={formData.requirements}
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
                    
                    {files.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <FileIcon className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-foreground truncate max-w-[200px]">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(file.size / 1024 / 1024).toFixed(1)}MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFiles(files.filter((_, i) => i !== index))}
                              className="text-muted-foreground hover:text-red-500 transition-colors"
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
                        className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/50 transition-all"
                      >
                        <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload files
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
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
            <Card className="overflow-hidden border border-border/60 bg-card text-foreground shadow-xl transition-all hover:border-blue-500/30 hover:shadow-2xl dark:border-blue-500/20 dark:bg-blue-950/40 dark:text-white dark:hover:border-blue-400/40 dark:hover:shadow-blue-500/10">             
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-blue-400" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-semibold">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-muted-foreground">Price</span>
                    <span
                      className="text-2xl font-bold text-blue-400 animate-in fade-in duration-300"
                    >
                      {selectedService.range}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-green-400 text-sm text-right">
                      {formatDate(deliveryFrom)} – {formatDate(deliveryTo)}
                    </span>
                  </div>
                  <div className="pt-2 text-sm text-muted-foreground space-y-2">
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Unlimited revisions
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      24/7 support
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
       <main className="min-h-screen py-18 px-4 bg-gradient-to-br from-background to-muted">
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
        </main>
      }
    >
      <OrderFormContent />
    </Suspense>
  )
}