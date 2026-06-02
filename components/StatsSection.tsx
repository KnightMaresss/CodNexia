'use client'
import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

function useCountUp(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start)
 
  useEffect(() => {
    let startTime: number | null = null
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      // Ease out quad for smooth deceleration
      const eased = 1 - (1 - progress) * (1 - progress)
      
      setCount(Math.floor(eased * (end - start) + start))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, start])

  return count
 }

function AnimatedStat({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const [startCounting, setStartCounting] = useState(false)
  const count = useCountUp(startCounting ? end : 0, 2000)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStartCounting(true)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)

    return () => observer.disconnect()
  }, [label])

  return (
   <div ref={ref} className="px-4">
    <p className="text-3xl font-black tracking-tight text-blue-500 tabular-nums dark:text-blue-400 dark:drop-shadow-[0_0_12px_rgba(96,165,250,0.45)]">
        {count}{suffix}
      </p>
    <p className="text-muted-foreground">{label}</p>
    </div>
  )
}

export default function StatsSection() {
 const t = useTranslations('Stats')
  return (
    <section className="relative border-y border-border/30 bg-background/40 px-6 py-2 backdrop-blur-xl">
      <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-border/30 text-center">
        <AnimatedStat end={10} suffix="+" label={t('services')} />
        <AnimatedStat end={98} suffix="%" label={t('satisfaction')} />
        <AnimatedStat end={2} suffix="h" label={t('responseTime')} />
      </div>
    </section>
  )
}