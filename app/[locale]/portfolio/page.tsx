'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
Star, 
Quote, 
TrendingUp, 
Award, 
Users, 
CheckCircle2, 
ArrowRight, 
ArrowLeft, 
Globe, 
Film, 
Stethoscope, 
Warehouse, 
ShieldAlert, 
Bot 
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import PremiumPageShell from '@/components/PremiumPageShell'
import { useLocale, useTranslations } from 'next-intl'
interface Rating {
  _id: string
  orderId: string
  studentName: string
  assignedToName: string
  service: string
  rating: number
  comment: string
  createdAt: string
}

export default function PortfolioPage() {
  const t = useTranslations('Portfolio')
  const tCheckout = useTranslations('Checkout')
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const getServiceName = (service: string) => {
  const services: Record<string, string> = {
    'graduation-projects': tCheckout('services.graduationProjects'),
    'academic-reports': tCheckout('services.academicReports'),
    'custom-websites': tCheckout('services.customWebsites'),
    'mobile-apps': tCheckout('services.mobileApps'),
    'powerpoint-presentations': tCheckout('services.powerpoint'),
    'cv-resume-writing': tCheckout('services.cv'),
    translation: tCheckout('services.translation'),
    'code-debugging': tCheckout('services.debugging'),
    'ai-automation': tCheckout('services.ai'),
    'ui-ux-design': tCheckout('services.uiux'),
  }

  return services[service] || service
}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ratings, setRatings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState({ total: 0, avgRating: 0, services: 0, happy: 0 })

  useEffect(() => {
    fetch('/api/ratings')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const allRatings = data.ratings || []
          setRatings(allRatings)
          
          const avg = allRatings.length > 0
            ? Math.round((allRatings.reduce((sum: number, r: Rating) => sum + r.rating, 0) / allRatings.length) * 10) / 10
            : 0
          const uniqueServices = new Set(allRatings.map((r: Rating) => r.service)).size
          
          setStats({
            total: allRatings.length,
            avgRating: avg,
            services: uniqueServices,
            happy: allRatings.filter((r: Rating) => r.rating >= 4).length
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredRatings = filter === 'all' 
    ? ratings 
    : ratings.filter(r => r.service === filter)

  const serviceOptions = [...new Set(ratings.map((r: Rating) => r.service))]

const featuredProjects = [
  { icon: Globe, title: t('projects.travel.title'), category: t('projects.travel.category'), description: t('projects.travel.description') },
  { icon: Film, title: t('projects.cinema.title'), category: t('projects.cinema.category'), description: t('projects.cinema.description') },
  { icon: Stethoscope, title: t('projects.medical.title'), category: t('projects.medical.category'), description: t('projects.medical.description') },
  { icon: Warehouse, title: t('projects.warehouse.title'), category: t('projects.warehouse.category'), description: t('projects.warehouse.description') },
  { icon: ShieldAlert, title: t('projects.malware.title'), category: t('projects.malware.category'), description: t('projects.malware.description') },
  { icon: Bot, title: t('projects.bots.title'), category: t('projects.bots.category'), description: t('projects.bots.description') },
]

if (loading) {
  return null
}


  return (
    <PremiumPageShell className="pt-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-5 py-2 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-500/10 backdrop-blur-xl dark:text-blue-300">
            <Award className="h-4 w-4" />
            {t('badge')}
          </div>
         {/* Page Header */}
<h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
  {t('title')}{' '}
  <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
    {t('titleHighlight')}
  </span>
</h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('subtitle')}
          </p>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: CheckCircle2, value: `${stats.total}+`, label: t('projectsDone'), color: 'text-green-600' },
              { icon: Star, value: stats.avgRating, label: t('avgRating'), color: 'text-yellow-500' },
              { icon: TrendingUp, value: stats.services, label: t('services'), color: 'text-blue-600' },
              { icon: Users, value: `${stats.happy}+`, label: t('happyClients'), color: 'text-purple-600' },
            ].map((s, i) => (
              <div key={i} className="group rounded-3xl border-2 border-border/40 bg-white/45 p-5 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] dark:bg-black/45">
                <s.icon className={`h-6 w-6 ${s.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
<section className="mx-auto max-w-7xl px-4 py-10">
  <div className="mb-8 text-center">
    <h2 className="text-3xl font-bold text-foreground">{t('featuredTitle')}</h2>
    <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">{t('featuredSubtitle')}</p>
  </div>

<div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
    {featuredProjects.map((project, index) => (
      <Card
        key={project.title}
        className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] dark:bg-black/45"
        style={{ animation: `fadeInUp 0.4s ease forwards`, animationDelay: `${index * 0.08}s` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_40%)]" />

        <CardContent className="relative p-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
            <project.icon className="h-6 w-6 text-blue-500" />
          </div>

          <span className="mb-3 inline-block rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
            {project.category}
          </span>

          <h3 className="mb-2 text-xl font-bold text-foreground">{project.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{project.description}</p>
        </CardContent>
      </Card>
    ))}
  </div>
</section>
      {/* Filter Bar */}
      {serviceOptions.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === 'all' 
                ? 'bg-blue-600 text-foreground dark:text-white shadow-md' 
                : 'border border-border/60 bg-white/45 text-muted-foreground backdrop-blur-xl hover:border-blue-500/30 hover:text-foreground dark:bg-black/35'
            }`}
          >
            {t('allProjects')}
          </button>
          {serviceOptions.map((service) => (
            <button
              key={service}
              onClick={() => setFilter(service)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === service 
                  ? 'bg-blue-600 text-foreground dark:text-white shadow-md' 
                  : 'border border-border/60 bg-white/45 text-muted-foreground backdrop-blur-xl hover:border-blue-500/30 hover:text-foreground dark:bg-black/35'
              }`}
            >
             {getServiceName(service)}
            </button>
          ))}
        </div>
      )}
<div className="max-w-7xl mx-auto px-4 mb-8 text-center">
  <h2 className="text-3xl font-bold text-foreground">
    {t('reviewsTitle')}
  </h2>
  <p className="mt-2 text-muted-foreground">
    {t('reviewsSubtitle')}
  </p>
</div>
     {/* Client Reviews Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {filteredRatings.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-20 text-center">
              <Quote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">{t('emptyTitle')}</p>
              <p className="text-muted-foreground text-sm">{t('emptySubtitle')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRatings.map((rating, index) => (

                 <Card 
                  key={rating._id || index} 
                  className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 opacity-0 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] dark:bg-black/45"
                  style={{ animation: `fadeInUp 0.4s ease forwards`, animationDelay: `${index * 0.1}s` }}
                >
<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_40%)]" />

                <CardContent className="p-5">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                     className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${star <= rating.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-600'}`}
                      />
                    ))}
                  </div>
                  
                  {/* Comment */}
                     {rating.comment && (
                    <div className="mb-4">
                      <Quote className="h-5 w-5 text-blue-300 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <p className="text-foreground italic leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                          &ldquo;{rating.comment}&rdquo;
                        </p>
                        {rating.comment.length > 100 && (
                          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white/80 to-transparent dark:from-black/80 group-hover:opacity-0 transition-opacity pointer-events-none" />
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Service Badge */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {getServiceName(rating.service)}
                    </span>
                  </div>
                  
                  {/* Divider */}
                  <div className="border-t border-border pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rating.studentName}</p>
                     <p className="text-xs text-muted-foreground">
                    {t('verifiedReview')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t('completedBy')}</p>
                      <p className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{rating.assignedToName || 'Codnexia'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 mt-16 text-center">
      <Card className="relative overflow-hidden rounded-3xl border-2 border-blue-500/20 bg-white/45 shadow-[0_24px_80px_rgba(37,99,235,0.16)] backdrop-blur-2xl dark:bg-black/55">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.20),transparent_35%),radial-gradient(circle_at_75%_60%,rgba(168,85,247,0.16),transparent_45%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_75%_60%,rgba(168,85,247,0.18),transparent_45%)]" />
          <CardContent className="py-12 px-6">
            <h2 className="text-3xl font-bold text-foreground dark:text-white mb-4">{t('ctaTitle')}</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
             {t('ctaSubtitle')}
            </p>
            <Link href="/orders">
             <Button
            size="lg"
            className="group h-12 w-full max-w-[240px] rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-600 to-blue-500 px-4 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(37,99,235,0.35)] transition-all duration-300 hover:scale-[1.03] hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_18px_50px_rgba(37,99,235,0.45)] sm:h-14 sm:w-auto sm:max-w-none sm:px-8 sm:text-lg"
              >
           {t('ctaButton')}
  {isRTL ? (
  <ArrowLeft className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
) : (
  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
)}
</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
</PremiumPageShell>
  )
}