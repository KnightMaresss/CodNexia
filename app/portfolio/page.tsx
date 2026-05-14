'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {  Star, Quote, TrendingUp, Award, Users, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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

  if (loading) {
    return (
      <main className="min-h-screen pt-16 pb-16 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          {/* Hero skeleton */}
          <div className="w-32 h-8 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 animate-pulse" />
          <div className="w-96 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto mb-4 animate-pulse" />
          <div className="w-64 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto mb-8 animate-pulse" />
          
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-border animate-pulse">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2" />
                <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
              </div>
            ))}
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-border animate-pulse">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <div key={s} className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded" />)}
                </div>
                <div className="w-8 h-5 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
                <div className="space-y-2 mb-4">
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="w-12 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-16 pb-16 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-5 dark:opacity-10" />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            <Award className="h-4 w-4" />
            Our Portfolio
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
            Work We&apos;re <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Proud Of</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Every project tells a story of dedication and excellence. See what our clients say about us.
          </p>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: CheckCircle2, value: `${stats.total}+`, label: 'Projects Done', color: 'text-green-600' },
              { icon: Star, value: stats.avgRating, label: 'Avg Rating', color: 'text-yellow-500' },
              { icon: TrendingUp, value: stats.services, label: 'Services', color: 'text-blue-600' },
              { icon: Users, value: `${stats.happy}+`, label: 'Happy Clients', color: 'text-purple-600' },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-border">
                <s.icon className={`h-6 w-6 ${s.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      {serviceOptions.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === 'all' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white dark:bg-slate-800 text-foreground border border-border hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            All Projects
          </button>
          {serviceOptions.map((service) => (
            <button
              key={service}
              onClick={() => setFilter(service)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === service 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-800 text-foreground border border-border hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {SERVICE_NAMES[service] || service}
            </button>
          ))}
        </div>
      )}

      {/* Testimonials Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {filteredRatings.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-20 text-center">
              <Quote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No projects in this category yet</p>
              <p className="text-muted-foreground text-sm">Check back soon for updates!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRatings.map((rating, index) => (

                 <Card 
                  key={rating._id || index} 
                  className="group border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-slate-800 overflow-hidden opacity-0"
                  style={{ animation: `fadeInUp 0.4s ease forwards`, animationDelay: `${index * 0.1}s` }}
                >


                <CardContent className="p-6">
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
                          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-slate-800 to-transparent group-hover:opacity-0 transition-opacity pointer-events-none" />
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Service Badge */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {SERVICE_NAMES[rating.service] || rating.service}
                    </span>
                  </div>
                  
                  {/* Divider */}
                  <div className="border-t border-border pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rating.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(rating.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Completed by</p>
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
        <Card className="border-0 shadow-xl bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
          <CardContent className="py-12 px-6">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Project?</h2>
            <p className="text-slate-300 mb-8 max-w-md mx-auto">
              Join our happy clients and get your work done by professionals.
            </p>
            <Link href="/orders">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-6 text-lg">
                Place Your Order Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}