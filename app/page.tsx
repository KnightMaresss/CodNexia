'use client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { 
  ArrowRight,
  GraduationCap,
  FileText,
  Globe,
  Smartphone,
  Presentation,
  FileUser,
  Languages,
  Bug,
}
from "lucide-react"
import StatsSection from '@/components/StatsSection'
import FAQSection from '@/components/FAQSection'

export default function Home() {
  const services = [
    {
      title: "Graduation Projects",
      description: "Complete thesis, documentation, and presentation",
      priceRange: "$150 - $400",
      icon: GraduationCap,
      slug: "graduation-projects",
    },
    {
      title: "Academic Reports",
      description: "Research papers, essays, and literature reviews",
      priceRange: "$50 - $200",
      icon: FileText,
      slug: "academic-reports",
    },
    {
      title: "Custom Websites",
      description: "Professional websites for portfolio or business",
      priceRange: "$400 - $1,000",
      icon: Globe,
      slug: "custom-websites",
    },
    {
      title: "Mobile Apps",
      description: "iOS/Android apps for student projects",
      priceRange: "$500 - $1,500",
      icon: Smartphone,
      slug: "mobile-apps",
    },
    {
      title: "PowerPoint Presentations",
      description: "Professional slides for thesis defense & class projects",
      priceRange: "$30 - $100",
      icon: Presentation,
      slug: "powerpoint-presentations",
    },
    {
      title: "CV/Resume Writing",
      description: "Professional CV for fresh graduates with ATS optimization",
      priceRange: "$50 - $150",
      icon: FileUser,
      slug: "cv-resume-writing",
    },
    {
      title: "Translation (En↔Ar)",
      description: "Academic document translation — human, no AI used",
      priceRange: "$20 - $80",
      icon: Languages,
      slug: "translation",
    },
    {
      title: "Code Debugging",
      description: "Fix bugs, review & optimize your code projects",
      priceRange: "$50 - $300",
      icon: Bug,
      slug: "code-debugging",
    },
  ]

  return (   
    <main className="min-h-screen pt-15">
      {/* Hero Section */}
      <section className="relative py-12 px-4 text-center bg-gradient-to-br from-background via-[#001a5c] to-background text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />   
        <div className="relative max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Academic Help &{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Web Development
            </span>{" "}
            for Students
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Expert assistance for graduation projects, reports, websites, and apps. 
            Get high-quality work delivered on time.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Services Section */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">Our Services</h2>
            <p className="text-muted-foreground">Click on a service to get started</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col border-0 shadow-md">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-all duration-300">
                    <service.icon className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-lg text-card-foreground">{service.title}</CardTitle>
                  <CardDescription className="text-sm">{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <p className="text-2xl font-bold text-card-foreground mb-4">{service.priceRange}</p>
                  <Link href={`/orders?service=${service.slug}`}>
                    <Button className="w-full group bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-300 border border-blue-100 dark:border-blue-900">
                      Order Now
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Track Section */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-gray-300 text-lg mb-8">
                Tell us what you need and we will get back to you within 24 hours
              </p>
            </div>

            <div className="text-center md:text-left">
              <div className="md:pl-8 md:border-l border-white/20">
                <h3 className="text-2xl font-bold mb-2">Already Have an Order?</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Enter your Order ID to check your status instantly
                </p>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const input = document.getElementById('home-track-input') as HTMLInputElement
                    const orderId = input.value.trim()
                    if (!orderId) return

                    const button = e.currentTarget.querySelector('button') as HTMLButtonElement
                    const errorSpan = document.getElementById('home-track-error')
                    
                    button.disabled = true
                    if (errorSpan) errorSpan.textContent = ''

                    try {
                      const res = await fetch('/api/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId }),
                      })
                      const data = await res.json()

                      if (data.success) {
                        sessionStorage.setItem('trackResult', JSON.stringify(data))
                        window.location.href = `/track?id=${orderId}&direct=true`
                      } else {
                        if (errorSpan) errorSpan.textContent = data.error || 'Order not found'
                      }
                    } catch {
                      if (errorSpan) errorSpan.textContent = 'Something went wrong. Please try again.'
                    }

                    button.disabled = false
                  }}
                  className="flex flex-col gap-2"
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="home-track-input"
                      type="text"
                      placeholder="Paste your Order ID"
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <Button 
                      type="submit"
                      size="lg"
                      className="bg-white text-slate-900 hover:bg-gray-100 px-8 py-6 text-lg sm:w-auto w-full"
                    >
                      Track
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                  <span id="home-track-error" className="text-red-400 text-sm text-left"></span>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />  
      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-950 text-gray-400 text-center text-sm">
        <p>© 2026 Codnexia. All rights reserved.</p>
      </footer>
    </main>
  )
}