'use client'

import { useEffect, useRef, useState } from 'react'

export default function PremiumPageShell({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      rafRef.current = requestAnimationFrame(() => {
        setMousePosition({ x: e.clientX, y: e.clientY })
      })
    }

    requestAnimationFrame(() => {
      setIsMounted(true)
    })

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <main className={`relative min-h-screen overflow-hidden bg-background text-foreground ${className}`}>
      {/* Premium global background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_110%_80%_at_50%_0%,rgba(59,130,246,0.32),transparent_56%),radial-gradient(ellipse_75%_65%_at_72%_55%,rgba(168,85,247,0.20),transparent_60%),linear-gradient(to_bottom,var(--background),var(--background))]" />

        <div
          className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-400/10"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            transition: 'transform 0.8s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
          }}
        />

        <div
          className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px] dark:bg-purple-400/10"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`,
            transition: 'transform 1s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
          }}
        />

        <div
          className="absolute top-1/2 left-1/2 h-[800px] w-[800px] rounded-full bg-cyan-500/5 blur-[140px] dark:bg-cyan-400/10"
          style={{
            transform: `translate(calc(-50% + ${mousePosition.x * 0.015}px), calc(-50% + ${mousePosition.y * 0.015}px))`,
            transition: 'transform 1.2s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
          }}
        />
      </div>

      <div
        className={`relative z-10 transition-all duration-700 ${
          isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {children}
      </div>
    </main>
  )
}