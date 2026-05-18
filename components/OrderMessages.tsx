'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { showToast } from './ui/toast'
import {
  CheckCheck,
  FileText,
  ImageIcon,
  Loader2,
  Paperclip,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react'

interface Message {
  id: string
  orderId: string
  sender: string
  senderRole: string
  message: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  createdAt: string
}

interface OrderMessagesProps {
  orderId: string
  userName?: string
}

export function OrderMessages({ orderId, userName }: OrderMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previousMessageIdsRef = useRef<Set<string>>(new Set())
  const initializedMessagesRef = useRef(false)

  const markSeen = useCallback(() => {
    fetch('/api/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    }).catch(() => {})
  }, [orderId])

  const playIncomingSoundOnce = (messageId: string) => {
    const soundKey = `chat-sound-${messageId}`

    if (sessionStorage.getItem(soundKey)) return

    sessionStorage.setItem(soundKey, 'played')

    const audio = new Audio('/chat.mp3')
    audio.play().catch(() => {})
  }

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?orderId=${orderId}`)
      const data = await res.json()

      if (data.success) {
        const nextMessages: Message[] = data.messages
        const previousIds = previousMessageIdsRef.current

        const newIncomingMessages = nextMessages.filter(
          (msg) => !previousIds.has(msg.id) && msg.senderRole !== userName
        )

        if (initializedMessagesRef.current && newIncomingMessages.length > 0) {
          playIncomingSoundOnce(newIncomingMessages[0].id)
        }

        previousMessageIdsRef.current = new Set(
          nextMessages.map((msg) => msg.id)
        )

        initializedMessagesRef.current = true
        setMessages(nextMessages)
      }
    } catch {
      // Keep chat quiet during temporary polling/network failures.
    } finally {
      setLoading(false)
    }
  }, [orderId, userName])

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      fetchMessages()
      markSeen()
    }, 0)

    const interval = setInterval(() => {
      fetchMessages()
      markSeen()
    }, 2000)

    return () => {
      clearTimeout(startTimeout)
      clearInterval(interval)
    }
  }, [fetchMessages, markSeen])

useEffect(() => {
  const container = messagesContainerRef.current
  if (!container) return

  container.scrollTo({
    top: container.scrollHeight,
    behavior: 'smooth',
  })
}, [messages])


  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            setSelectedFile(file)
            break
          }
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() && !selectedFile) return

    setSending(true)

    try {
      let res: Response

      if (selectedFile) {
        const formData = new FormData()
        formData.append('orderId', orderId)
        formData.append('message', newMessage.trim())
        formData.append('file', selectedFile)

        res = await fetch('/api/messages', {
          method: 'POST',
          body: formData,
        })
      } else {
        res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, message: newMessage }),
        })
      }

      const data = await res.json()

      if (data.success) {
        setMessages((prev) => [...prev, data.message])
        previousMessageIdsRef.current.add(data.message.id)
        setNewMessage('')
        setSelectedFile(null)
        inputRef.current?.focus()
        markSeen()
      } else {
        showToast(data.error || 'Failed to send', 'error')
      }
    } catch {
      showToast('Failed to send message', 'error')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDateLabel = (date: string) => {
    const msgDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (msgDate.toDateString() === today.toDateString()) return 'Today'
    if (msgDate.toDateString() === yesterday.toDateString()) return 'Yesterday'

    return msgDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getSenderInitial = (msg: Message, isOwnMessage: boolean) => {
    if (isOwnMessage) return 'Y'
    if (msg.senderRole === 'admin') return 'C'
    return 'S'
  }

  const getSenderLabel = (msg: Message, isOwnMessage: boolean) => {
    if (isOwnMessage) return 'You'
    if (msg.senderRole === 'admin') return 'Codnexia Team'
    return msg.sender || 'Client'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          Loading messages...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[430px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Order Chat</p>
            <p className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live support conversation
            </p>
          </div>
        </div>

        <div className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
          {messages.length} message{messages.length === 1 ? '' : 's'}
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-slate-50/70 px-4 py-4 dark:bg-slate-950/30"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-xs text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/50">
                <Send className="h-7 w-7 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-foreground">No messages yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start the conversation with the client about this order.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isOwnMessage = msg.senderRole === userName
              const showAvatar =
                index === 0 || messages[index - 1].senderRole !== msg.senderRole
              const showDate =
                index === 0 ||
                new Date(msg.createdAt).toDateString() !==
                  new Date(messages[index - 1].createdAt).toDateString()

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="my-4 flex justify-center">
                      <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                        {getDateLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex gap-2 ${
                      isOwnMessage ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isOwnMessage && (
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                          msg.senderRole === 'admin' ? 'bg-blue-600' : 'bg-emerald-600'
                        } ${!showAvatar ? 'invisible' : ''}`}
                      >
                        {getSenderInitial(msg, isOwnMessage)}
                      </div>
                    )}

                    <div
                      className={`flex max-w-[78%] flex-col ${
                        isOwnMessage ? 'items-end' : 'items-start'
                      }`}
                    >
                      {showAvatar && (
                        <p className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">
                          {getSenderLabel(msg, isOwnMessage)}
                        </p>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          isOwnMessage
                            ? 'rounded-tr-md bg-blue-600 text-white'
                            : 'rounded-tl-md border border-border bg-background text-foreground'
                        }`}
                      >
                        {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}

                        {msg.fileUrl && (
                          <div className={msg.message ? 'mt-2' : ''}>
                            {msg.fileType?.startsWith('image/') ? (
                              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={msg.fileUrl}
                                  alt={msg.fileName || 'Image attachment'}
                                  loading="lazy"
                                  className="max-h-[260px] max-w-[260px] rounded-xl object-cover transition-opacity hover:opacity-90"
                                />
                              </a>
                            ) : (
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                  isOwnMessage
                                    ? 'bg-white/15 text-white hover:bg-white/20'
                                    : 'bg-muted text-blue-600 hover:bg-muted/80'
                                }`}
                              >
                                <FileText className="h-4 w-4" />
                                <span className="truncate">{msg.fileName || 'Download file'}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        className={`mt-1 flex items-center gap-1 px-1 ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <p className="text-[10px] text-muted-foreground">
                          {formatTime(msg.createdAt)}
                        </p>
                        {isOwnMessage && <CheckCheck className="h-3 w-3 text-blue-400" />}
                      </div>
                    </div>

                    {isOwnMessage && (
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-slate-700 ${
                          !showAvatar ? 'invisible' : ''
                        }`}
                      >
                        {getSenderInitial(msg, isOwnMessage)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="border-t border-border bg-background px-3 py-2">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              {selectedFile.type.startsWith('image/') ? (
                <ImageIcon className="h-4 w-4 shrink-0 text-blue-600" />
              ) : (
                <Paperclip className="h-4 w-4 shrink-0 text-blue-600" />
              )}
              <span className="truncate text-foreground">{selectedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-background hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-border bg-background p-3"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          aria-label="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.png,.jpg,.jpeg,.gif,.webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) setSelectedFile(file)
            e.target.value = ''
          }}
        />

        <input
          ref={inputRef}
          type="text"
          placeholder="Write a message..."
          className="h-10 flex-1 rounded-full border border-transparent bg-muted px-4 text-sm text-foreground outline-none transition focus:border-blue-500 focus:bg-background focus:ring-2 focus:ring-blue-500/20"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />

        <Button
          type="submit"
          size="icon"
          disabled={sending || (!newMessage.trim() && !selectedFile)}
          className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
