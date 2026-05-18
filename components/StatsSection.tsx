'use client'
import { useState, useEffect, useRef } from 'react'

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
    <div ref={ref}>
      <p className="text-3xl font-bold text-foreground tabular-nums dark:text-blue-400 dark:drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">
        {count}{suffix}
      </p>
    <p className="text-muted-foreground">{label}</p>
    </div>
  )
}

export default function StatsSection() {
  return (
   <section className="py-2 px-4 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-8 text-center">
        <AnimatedStat end={500} suffix="+" label="Happy Clients" />
        <AnimatedStat end={98} suffix="%" label="Satisfaction Rate" />
        <div>
         <p className="text-3xl font-bold text-foreground dark:text-blue-400 dark:drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">24/7</p>
         <p className="text-muted-foreground">Support</p>
        </div>
      </div>
    </section>
  )
}