'use client'
import { useEffect, useRef } from 'react'

export type SoundType = 'notification' | 'chat'

interface SoundNotificationProps {
  play: boolean
  type?: SoundType
}

const SOUND_FILES: Record<SoundType, string> = {
  notification: '/notification.mp3',
  chat: '/chat.mp3',
}

export function SoundNotification({ play, type = 'notification' }: SoundNotificationProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (play && audioRef.current) {
      audioRef.current.volume = 0.3
      audioRef.current.play().catch(() => {})
    }
  }, [play])

  return (
    <audio ref={audioRef} src={SOUND_FILES[type]} preload="auto" />
  )
}