'use client'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { showToast } from './ui/toast'
import {
  Check,
  CheckCheck,
  FileText,
  ImageIcon,
  Loader2,
  Paperclip,
  Send,
  ShieldCheck,
  X,
  Copy,
  Download,
  Edit3,
  Trash2,
  MoreHorizontal,
  Search,
  ChevronUp,
  ChevronDown
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
  editedAt?: string
  status?: 'sent' | 'delivered' | 'seen' | 'failed'
  isOptimistic?: boolean
  isDeleted?: boolean
  deletedAt?: string
  deletedBy?: string
  deletedByRole?: string
  replyToMessageId?: string

replyToMessage?: {
  id: string
  sender: string
  senderRole: string
  message: string
  fileName?: string
  fileType?: string
  isDeleted?: boolean
} | null
}

interface OrderMessagesProps {
  orderId: string
  userName?: string
}

export function OrderMessages({ orderId, userName }: OrderMessagesProps) {
  const t = useTranslations('OrderMessages')
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null)
  const [imageZoom, setImageZoom] = useState(1)
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  const [isPanningImage, setIsPanningImage] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previousMessageIdsRef = useRef<Set<string>>(new Set())
  const initializedInChatSoundRef = useRef(false)
  const initializedMessagesRef = useRef(false)
  const previousMessageCountRef = useRef(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chatRootRef = useRef<HTMLDivElement>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const initialScrollDoneRef = useRef(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchIndex, setActiveSearchIndex] = useState(0)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [failedMessages, setFailedMessages] = useState<Record<string, Message>>({})
  const [contextMenu, setContextMenu] = useState<{
  x: number
  y: number
  message: Message
} | null>(null)
  const markSeen = useCallback(() => {
    fetch('/api/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    }).catch(() => {})
  }, [orderId])


  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?orderId=${orderId}`)
      const data = await res.json()

      if (data.success) {

const nextMessages: Message[] = data.messages

const previousIds = previousMessageIdsRef.current

const newIncomingMessages = nextMessages.filter(
  (msg) =>
    !previousIds.has(msg.id) &&
    msg.senderRole !== userName &&
    !msg.isDeleted
)

if (initializedInChatSoundRef.current && newIncomingMessages.length > 0) {
  const audio = new Audio('/chat-tick.mp3')
  audio.volume = 0.35
  audio.play().catch(() => {})
}

previousMessageIdsRef.current = new Set(
  nextMessages.map((msg) => msg.id)
)

initializedInChatSoundRef.current = true
initializedMessagesRef.current = true

setMessages((prev) => {


  const localMessages = prev.filter(
  (msg) => msg.isOptimistic || msg.status === 'failed'
)

return [...nextMessages, ...localMessages]
})
      }
    } catch {
      // Keep chat quiet during temporary polling/network failures.
    } finally {
      setLoading(false)
    }
  }, [orderId, userName])


useEffect(() => {
  const fetchTypingStatus = async () => {
    try {
      const res = await fetch(`/api/messages/typing?orderId=${orderId}`)
      const data = await res.json()

      if (data.success) {
        setIsOtherTyping(data.isTyping)
      }
    } catch {}
  }

  fetchTypingStatus()

  const interval = setInterval(fetchTypingStatus, 2000)

  return () => clearInterval(interval)
}, [orderId])


useEffect(() => {
  if (!newMessage.trim()) {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (isTyping) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTyping(false)

      fetch('/api/messages/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          isTyping: false,
        }),
      }).catch(() => {})
    }

    return
  }

  if (!isTyping) {
    setIsTyping(true)

    fetch('/api/messages/typing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        isTyping: true,
      }),
    }).catch(() => {})
  }

  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current)
  }

  typingTimeoutRef.current = setTimeout(() => {
    setIsTyping(false)

    fetch('/api/messages/typing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        isTyping: false,
      }),
    }).catch(() => {})
  }, 2500)
}, [newMessage, orderId, isTyping])



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
  if (previewImage) return

  const container = messagesContainerRef.current
  if (!container) return

  const messageCount = messages.length
  const hasNewMessage = messageCount > previousMessageCountRef.current

  if (!initialScrollDoneRef.current && messages.length > 0) {
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight
      initialScrollDoneRef.current = true
      previousMessageCountRef.current = messages.length
    })

    return
  }

  const distanceFromBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight

  const isNearBottom = distanceFromBottom < 120

  if (hasNewMessage && isNearBottom) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    })
  }

  previousMessageCountRef.current = messageCount
}, [messages.length, previewImage])



useEffect(() => {
  const container = messagesContainerRef.current
  if (!container) return

  const handleScroll = () => {
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight

    setShowScrollButton(distanceFromBottom > 120)
  }

  container.addEventListener('scroll', handleScroll)
  handleScroll()

  return () => container.removeEventListener('scroll', handleScroll)
}, [messages.length])


useEffect(() => {
  if (searchOpen) {
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }
}, [searchOpen])

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


useEffect(() => {
  if (!contextMenu) return

  const closeMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement

    if (target.closest('[data-message-menu="true"]')) return

    setContextMenu(null)
  }

  window.addEventListener('mousedown', closeMenu)

  return () => {
    window.removeEventListener('mousedown', closeMenu)
  }
}, [contextMenu])



useEffect(() => {
  if (!previewImage) return

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setPreviewImage(null)
      setImageZoom(1)
      setImageOffset({ x: 0, y: 0 })
      setIsPanningImage(false)
    }

    if (e.key === '+' || e.key === '=') {
      setImageZoom((prev) => Math.min(5, prev + 0.25))
    }

    if (e.key === '-') {
      setImageZoom((prev) => {
        const next = Math.max(1, prev - 0.25)

        if (next === 1) {
          setImageOffset({ x: 0, y: 0 })
        }

        return next
      })
    }

    if (e.key === '0') {
      setImageZoom(1)
      setImageOffset({ x: 0, y: 0 })
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => {
    window.removeEventListener('keydown', handleKeyDown)
  }
}, [previewImage])



  const handleSend = async (e: React.FormEvent) => {
       e.preventDefault() 
    if (!newMessage.trim() && !selectedFile) return
const optimisticId = `optimistic-${Date.now()}`
const optimisticMessage: Message = {
  id: optimisticId,
  orderId,
  sender: userName || 'You',
  senderRole: userName || 'student',
  message: newMessage.trim(),
  fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : '',
  fileName: selectedFile?.name || '',
  fileType: selectedFile?.type || '',
  createdAt: new Date().toISOString(),
  replyToMessageId: replyingTo?.id || '',
  replyToMessage: replyingTo,
  status: 'sent',
  isOptimistic: true,
}

requestAnimationFrame(() => {
  setMessages((prev) => [...prev, optimisticMessage])
})

    setSending(true)

    try {
      let res: Response

      if (selectedFile) {
        const formData = new FormData()
        formData.append('orderId', orderId)
        formData.append('message', newMessage.trim())
        formData.append('replyToMessageId', replyingTo?.id || '')
        formData.append('file', selectedFile)

        res = await fetch('/api/messages', {
          method: 'POST',
          body: formData,
        })
      } else {
        res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
  orderId,
  message: newMessage,
  replyToMessageId: replyingTo?.id || '',
}),
        })
      }

      const data = await res.json()

      if (data.success) {
       setMessages((prev) =>
  prev.map((msg) =>
    msg.id === optimisticId ? data.message : msg
  )
)
        previousMessageIdsRef.current.add(data.message.id)
        setNewMessage('')
        setIsTyping(false)

fetch('/api/messages/typing', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    orderId,
    isTyping: false,
  }),
}).catch(() => {})
        setSelectedFile(null)
        setReplyingTo(null)
        inputRef.current?.focus()
        markSeen()
      } else {
       setMessages((prev) =>
  prev.map((msg) =>
    msg.id === optimisticId
      ? { ...msg, status: 'failed', isOptimistic: false }
      : msg
  )
)

setFailedMessages((prev) => ({
  ...prev,
  [optimisticId]: optimisticMessage,
}))

showToast(data.error || t('messageFailedRetry'), 'error')
      }
   } catch {
 setMessages((prev) =>
  prev.map((msg) =>
    msg.id === optimisticId
      ? { ...msg, status: 'failed', isOptimistic: false }
      : msg
  )
)

setFailedMessages((prev) => ({
  ...prev,
  [optimisticId]: optimisticMessage,
}))

showToast(t('messageFailedRetry'), 'error')
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

   if (msgDate.toDateString() === today.toDateString()) return t('today')
   if (msgDate.toDateString() === yesterday.toDateString()) return t('yesterday')

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
  if (isOwnMessage) return t('you')
  if (msg.senderRole === 'admin') return t('codnexiaTeam')
  return msg.sender || t('client')
  }

const openMessageMenu = (e: React.MouseEvent, msg: Message) => {
  const root = chatRootRef.current
  if (!root) return

  const bubble = e.currentTarget as HTMLElement
  const bubbleRect = bubble.getBoundingClientRect()
  const rootRect = root.getBoundingClientRect()

  const menuWidth = 176
  const gap = 10

  const rawX =
    msg.senderRole === userName
      ? bubbleRect.left - rootRect.left - menuWidth - gap
      : bubbleRect.right - rootRect.left + gap

  const x = Math.max(8, Math.min(rawX, rootRect.width - menuWidth - 8))
  const y = Math.max(8, Math.min(bubbleRect.top - rootRect.top, rootRect.height - 180))

  setContextMenu({ x, y, message: msg })
}
const jumpToMessage = (messageId: string) => {
  const element = document.getElementById(`message-${messageId}`)

  if (!element) return

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })

  setHighlightedMessageId(messageId)

  setTimeout(() => {
    setHighlightedMessageId(null)
  }, 2200)
}

const searchResults = searchQuery.trim()
  ? messages.filter((msg) =>
      msg.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
  : []

const jumpToSearchResult = (direction: 'next' | 'prev') => {
  if (searchResults.length === 0) return

  const nextIndex =
    direction === 'next'
      ? (activeSearchIndex + 1) % searchResults.length
      : (activeSearchIndex - 1 + searchResults.length) % searchResults.length

  setActiveSearchIndex(nextIndex)

  const message = searchResults[nextIndex]
  jumpToMessage(message.id)
}

const scrollToLatest = () => {
  const container = messagesContainerRef.current
  if (!container) return

  container.scrollTo({
    top: container.scrollHeight,
    behavior: 'smooth',
  })
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
   <div ref={chatRootRef} className="relative flex h-[430px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t('orderChat')}</p>
            <p className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t('liveSupport')}
            </p>
          </div>
          
        </div>

      <div className="flex items-center gap-2">
  <button
    type="button"
    onClick={() => setSearchOpen((prev) => !prev)}
    className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
    aria-label="Search messages"
  >
    <Search className="h-4 w-4" />
  </button>

  <div className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
   {messages.length === 1
    ? t('messageCountOne', { count: messages.length })
    : t('messageCount', { count: messages.length })}
  </div>
</div>

  </div>
  {searchOpen && (
  <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-2">
    <div className="flex h-9 flex-1 items-center gap-2 rounded-full border border-border bg-muted px-3">
      <Search className="h-4 w-4 text-muted-foreground" />


     <input
  ref={searchInputRef}
  value={searchQuery}
  onChange={(e) => {
    setSearchQuery(e.target.value)
    setActiveSearchIndex(0)
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      jumpToSearchResult(e.shiftKey ? 'prev' : 'next')
    }
  }}
  placeholder={t('searchMessages')}
  className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
/>


    </div>

  <span className="min-w-[52px] text-center text-xs text-muted-foreground">
  {searchQuery.trim() && searchResults.length > 0
    ? `${activeSearchIndex + 1}/${searchResults.length}`
    : '0/0'}
</span>

    <button
      type="button"
      onClick={() => jumpToSearchResult('prev')}
      disabled={searchResults.length === 0}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-40"
    >
      <ChevronUp className="h-4 w-4" />
    </button>

    <button
      type="button"
      onClick={() => jumpToSearchResult('next')}
      disabled={searchResults.length === 0}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-40"
    >
      <ChevronDown className="h-4 w-4" />
    </button>

    <button
      type="button"
      onClick={() => {
        setSearchOpen(false)
        setSearchQuery('')
      }}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
)}
<div
  ref={messagesContainerRef}
  onDragOver={(e) => {
    e.preventDefault()
    setIsDraggingFile(true)
  }}
  onDragLeave={(e) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDraggingFile(false)
  }}
  onDrop={(e) => {
    e.preventDefault()
    setIsDraggingFile(false)

    const file = e.dataTransfer.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast(t('imagesOnly'), 'warning')
      return
    }

    setSelectedFile(file)
  }}
  className={`relative flex-1 overflow-y-auto px-4 py-4 transition-all duration-300 ${
    isDraggingFile
      ? 'border-blue-500 bg-blue-500/5 shadow-[inset_0_0_80px_rgba(37,99,235,0.12)]'
      : 'bg-slate-50/70 dark:bg-slate-950/30'
  }`}
>
{isDraggingFile && (
 <div className="pointer-events-none sticky top-0 z-30 -mb-[100%] flex h-full flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm">
    <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 px-8 py-6 shadow-[0_0_60px_rgba(37,99,235,0.18)]">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20">
        <ImageIcon className="h-7 w-7 text-blue-400" />
      </div>

      <p className="text-center text-lg font-semibold text-white">
        Drop image here
      </p>

      <p className="mt-1 text-center text-sm text-slate-300">
        Attach image to conversation
      </p>
    </div>
  </div>
)}
        {messages.length === 0 ? (


       <div className="flex h-full items-center justify-center">
  <div className="max-w-sm text-center">
    
    <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
      
      <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-2xl" />

      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10 shadow-[0_0_40px_rgba(37,99,235,0.12)]">
        <Send className="h-9 w-9 text-blue-500" />
      </div>
    </div>

    <p className="text-lg font-semibold text-foreground">
      Start the conversation
    </p>

    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
      Share updates, send files, and keep everything about this order in one place.
    </p>
    </div>
  </div>



        ) : (
        <div className={`${isDraggingFile ? 'opacity-20 blur-[1px]' : ''}`}>
            {messages.map((msg, index) => {
            const isOwnMessage = msg.senderRole === userName
const previousMessage = messages[index - 1]

const isGrouped =
  previousMessage &&
  previousMessage.senderRole === msg.senderRole &&
  new Date(msg.createdAt).getTime() -
    new Date(previousMessage.createdAt).getTime() <
    5 * 60 * 1000

const showAvatar = !isGrouped

const showDate =
                index === 0 ||
                new Date(msg.createdAt).toDateString() !==
                  new Date(messages[index - 1].createdAt).toDateString()
 return (
<div
  id={`message-${msg.id}`}
  key={msg.id}
  className={`animate-in fade-in slide-in-from-bottom-2 zoom-in-[0.98] duration-300 rounded-2xl transition-all ${
 highlightedMessageId === msg.id ||
searchResults[activeSearchIndex]?.id === msg.id
    ? 'bg-blue-500/10 ring-2 ring-blue-500/40 shadow-[0_0_40px_rgba(37,99,235,0.25)]'
    : ''
}`}
>
                  {showDate && (
                    <div className="my-4 flex justify-center">
                      <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                        {getDateLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}

<div
  className={`flex ${
    isGrouped ? 'mt-1' : 'mt-4'
  } gap-2 ${
    isOwnMessage ? 'justify-end' : 'justify-start'
  }`}
>
                    {!isOwnMessage && (
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                          msg.senderRole === 'admin' ? 'bg-blue-600' : 'bg-emerald-600'
                       }} ${!showAvatar ? 'invisible' : ''}`}
                      >
                        {getSenderInitial(msg, isOwnMessage)}
                      </div>
                    )}


<div
className="group/message flex max-w-[78%] items-start gap-2"
>
  <div
    className={`flex flex-col ${
      isOwnMessage ? 'items-end' : 'items-start'
    }`}
  >

                      {showAvatar && (
                        <p className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">
                          {getSenderLabel(msg, isOwnMessage)}
                        </p>
                      )}

<div
 onMouseEnter={() => setHoveredMessageId(msg.id)}
 onMouseLeave={() => setHoveredMessageId(null)}
  onContextMenu={(e) => {
    e.preventDefault()
    e.stopPropagation()
    openMessageMenu(e, msg)
  }}
 className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all duration-300 ${
  msg.isOptimistic
    ? 'scale-[0.98] opacity-60 blur-[0.2px]'
    : 'scale-100 opacity-100'
} ${
  isOwnMessage
    ? 'rounded-tr-md bg-blue-600 text-white'
    : 'rounded-tl-md border border-border bg-background text-foreground'
}`}>
                        
    {hoveredMessageId === msg.id && (
  <div className="mb-1 text-center text-[10px] text-white/60">
    {new Date(msg.createdAt).toLocaleString()}
  </div>
)}


    {msg.replyToMessage && (
  <button
  type="button"
  onClick={() => jumpToMessage(msg.replyToMessageId!)}
  className={`mb-2 w-full rounded-xl border-l-2 px-3 py-2 text-left text-xs transition hover:opacity-90 ${
    isOwnMessage
      ? 'border-white/50 bg-white/10 text-white/80'
      : 'border-blue-500 bg-blue-500/10 text-muted-foreground'
  }`}>
    <p className="font-semibold">
      {msg.replyToMessage.senderRole === userName ? 'You' : getSenderLabel(msg.replyToMessage as Message, false)}
    </p>

   <p className="truncate italic">
  {msg.replyToMessage.isDeleted
    ? 'Deleted message'
    : msg.replyToMessage.message ||
      msg.replyToMessage.fileName ||
      'Attachment'}
</p>
    
</button>
)}
  

 {msg.isDeleted ? (
 <p
  className={`italic ${
    isOwnMessage
      ? 'text-white/90 dark:text-white/80'
      : 'text-slate-600 dark:text-muted-foreground'
  }`}
>
  Message deleted
  {msg.deletedAt ? ` • ${formatTime(msg.deletedAt)}` : ''}
</p>
) : msg.message && (
  editingMessageId === msg.id ? (
    <div className="space-y-2">
     <textarea
  value={editingText}
  onChange={(e) => setEditingText(e.target.value)}
  onKeyDown={async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()

      try {
        const res = await fetch('/api/messages', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageId: msg.id,
            message: editingText,
          }),
        })

        const data = await res.json()
        if (data.success) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id
                ? {
                    ...m,
                    message: editingText,
                    editedAt: new Date().toISOString(),
                  }
                : m
            )
          )

          setEditingMessageId(null)
          setEditingText('')
          showToast(t('messageUpdated'), 'success')
        } else {
          showToast(data.error || t('editFailed'), 'error')
        }
      } catch {
        showToast(t('editFailed'), 'error')
      }
    }
  }}


        autoFocus
        rows={3}
        className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-blue-500"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setEditingMessageId(null)
            setEditingText('')
          }}
          className="rounded-lg px-3 py-1 text-xs text-muted-foreground hover:bg-white/5"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              const res = await fetch('/api/messages', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messageId: msg.id,
                  message: editingText,
                }),
              })

              const data = await res.json()

              if (data.success) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === msg.id
                     ? {
                 ...m,
                 message: editingText,
                 editedAt: new Date().toISOString(),
                 }
                   : m
                  )
                )

                setEditingMessageId(null)
                setEditingText('')
                showToast(t('messageUpdated'), 'success')
              } else {
                showToast(data.error || t('editFailed'), 'error')
              }
            } catch {
              showToast(t('editFailed'), 'error')
            }
          }}
          className="rounded-lg bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  ) : (
    <p className="whitespace-pre-wrap break-words">
      {msg.message}
    </p>
  )
)}

{!msg.isDeleted && msg.fileUrl && (
<div className={msg.message ? 'mt-2' : ''}>
{msg.fileType?.startsWith('image/') ? (
<button
  type="button"
 onClick={() => {
  setImageZoom(1)
  setImageOffset({ x: 0, y: 0 })

  setPreviewImage({
      url: msg.fileUrl!,
      name: msg.fileName || 'Image attachment',
    })
}}
  className="block overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.01] hover:opacity-90"
>
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img
    src={msg.fileUrl}
    alt={msg.fileName || 'Image attachment'}
    loading="lazy"
    className="max-h-[260px] max-w-[260px] rounded-xl object-cover"
  />
</button>
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
  className={`mt-0.5 flex items-center gap-1 px-1 ${
    isOwnMessage ? 'justify-end' : 'justify-start'
  }`}
>

{!isGrouped && (
  <div className="flex items-center gap-1">
    {msg.editedAt && (
      <span className="text-[10px] italic text-muted-foreground/70">
        edited
      </span>
    )}

    <p className="text-[10px] text-muted-foreground">
      {formatTime(msg.createdAt)}
    </p>
  </div>
)}




{isOwnMessage && (
  msg.status === 'failed' ? (
    <button
      type="button"

onClick={() => {
  const failed = failedMessages[msg.id]
  if (!failed) return

  setNewMessage(failed.message)
  setMessages((prev) => prev.filter((m) => m.id !== msg.id))
  setFailedMessages((prev) => {
    const copy = { ...prev }
    delete copy[msg.id]
    return copy
  })

  setTimeout(() => {
    inputRef.current?.focus()
  }, 50)

  showToast(t('messageRestored'), 'success')
}}


      className="text-[10px] font-medium text-red-500 hover:underline"
    >
      Retry
    </button>
  ) : msg.isOptimistic ? (
    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
  ) : msg.status === 'seen' ? (
    <CheckCheck className="h-3 w-3 text-blue-400" />
  ) : msg.status === 'delivered' ? (
    <CheckCheck className="h-3 w-3 text-muted-foreground" />
  ) : (
    <Check className="h-3 w-3 text-muted-foreground" />
  )
)}
  </div>



  </div>
  </div>
<button
  type="button"
  onClick={(e) => {
    e.preventDefault()
    e.stopPropagation()
    openMessageMenu(e, msg)
  }}
  className={`mt-7 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground opacity-70 shadow-sm backdrop-blur-sm transition-all hover:bg-muted hover:text-foreground hover:opacity-100 ${
  isOwnMessage ? 'order-first' : ''
}`}
  aria-label="Message actions"
>
  <MoreHorizontal className="h-4 w-4" />
</button>


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
           {isOtherTyping && (
  <div className="flex items-center gap-2 px-2 pb-1 animate-in fade-in duration-200">
    <div className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 shadow-sm">
      <span className="text-xs text-muted-foreground">
       {userName === 'student'
  ? 'Codnexia Team is typing'
  : 'Client is typing'}
      </span>

      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" />
      </div>
    </div>
  </div>
)}

<div ref={messagesEndRef} />
          </div>
          
        )}
      </div>

     {selectedFile && (
  <div className="border-t border-border bg-background px-3 py-3">
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/40 p-3 backdrop-blur-sm">
      
      <div className="flex min-w-0 items-center gap-3">
        {selectedFile.type.startsWith('image/') ? (
          <div className="relative overflow-hidden rounded-xl border border-blue-500/20 shadow-[0_8px_24px_rgba(37,99,235,0.12)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={URL.createObjectURL(selectedFile)}
              alt={selectedFile.name}
              className="h-16 w-16 object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-background">
            <Paperclip className="h-6 w-6 text-blue-500" />
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {selectedFile.name}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSelectedFile(null)}
        className="rounded-full border border-border bg-background p-2 text-muted-foreground transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
)}

{replyingTo && (
  <div className="border-t border-border bg-background px-3 py-2">
    <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-blue-500">
          Replying to {replyingTo.senderRole === userName ? 'yourself' : getSenderLabel(replyingTo, false)}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {replyingTo.message || replyingTo.fileName || 'Attachment'}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setReplyingTo(null)}
        className="rounded-full p-1 text-muted-foreground hover:bg-background hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
)}

      <form
        onSubmit={handleSend}
       className={`flex items-center gap-2 border-t border-border bg-background p-3 transition-all duration-300 ${
  sending
    ? 'bg-blue-500/[0.03] shadow-[inset_0_1px_20px_rgba(37,99,235,0.08)]'
    : ''
}`}
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
          placeholder={t('writeMessage')}
          className={`h-10 flex-1 rounded-full border border-transparent bg-muted px-4 text-sm text-foreground outline-none transition-all duration-300 focus:border-blue-500 focus:bg-background focus:ring-2 focus:ring-blue-500/20 ${
          sending ? 'opacity-70' : ''
             }`}
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



{contextMenu && (
  <div
    data-message-menu="true"
    onMouseDown={(e) => e.stopPropagation()}
    onClick={(e) => e.stopPropagation()}
    className="absolute z-[9999] w-44 overflow-hidden rounded-2xl border border-border bg-background/95 p-1 shadow-2xl backdrop-blur-xl"
    style={{
      top: contextMenu.y,
      left: contextMenu.x,
    }}
  >


{!contextMenu.message.isDeleted && contextMenu.message.message && (
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(contextMenu.message.message)
          showToast(t('messageCopied'), 'success')
          setContextMenu(null)
        }}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
      >
        <Copy className="h-4 w-4" />
        Copy
      </button> 
    )}


{!contextMenu.message.isDeleted && (
  <button
    type="button"
    onClick={() => {
      setReplyingTo(contextMenu.message)
      setContextMenu(null)
      inputRef.current?.focus()
    }}
    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
  >
    Reply
  </button>
)}


{!contextMenu.message.isDeleted && contextMenu.message.message && contextMenu.message.senderRole === userName && (
      <button
        type="button"
   onClick={() => {
  setEditingMessageId(contextMenu.message.id)
  setEditingText(contextMenu.message.message)
  setContextMenu(null)
}}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
      >
        <Edit3 className="h-4 w-4" />
        Edit
      </button>
    )}

{!contextMenu.message.isDeleted && contextMenu.message.fileUrl && (
   <button
  type="button"
  onClick={async () => {
    try {
      const response = await fetch(contextMenu.message.fileUrl!)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download =
        contextMenu.message.fileName ||
        (contextMenu.message.fileType?.startsWith('image/')
          ? 'image'
          : 'file')

      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(url)

      setContextMenu(null)
    } catch {
      showToast(t('downloadFailed'), 'error')
    }
  }}

        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
      >
        <Download className="h-4 w-4" />
        Download
        
      </button>
    )}
{!contextMenu.message.isDeleted && contextMenu.message.senderRole === userName && (
    <button
      type="button"
      onClick={async () => {
        const messageId = contextMenu.message.id
        setContextMenu(null)

        try {
          const res = await fetch('/api/messages', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId }),
          })

          const data = await res.json()

          if (data.success) {
            setMessages((prev) =>
  prev.map((msg) =>
    msg.id === messageId
      ? {
          ...msg,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          message: '',
          fileUrl: '',
          fileName: '',
          fileType: '',
        }
      : msg
  )
)
            showToast(t('messageDeleted'), 'success')
          } else {
           showToast(data.error || t('deleteFailed'), 'error')
          }
        } catch {
         showToast(t('deleteFailed'), 'error')
        }
      }}
      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/10"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </button>
    )}
  </div>
)}

{showScrollButton && (
  <button
    type="button"
    onClick={scrollToLatest}
    className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground shadow-lg transition hover:bg-muted"
  >
    Scroll to latest
  </button>
)}

{previewImage && (
  <div
    className="animate-in fade-in duration-200 fixed inset-0 z-50 flex touch-none overscroll-none items-center justify-center overflow-hidden bg-black/80 p-4 backdrop-blur-xl"
onClick={(e) => e.stopPropagation()}
  >


  <div
  className="animate-in zoom-in-95 fade-in duration-200 relative max-h-[90vh] max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
  onClick={(e) => e.stopPropagation()}
  onWheel={(e) => {
    e.preventDefault()
    e.stopPropagation()

   setImageZoom((prev) => {
  const next = Math.min(
    5,
    Math.max(1, prev + (e.deltaY < 0 ? 0.2 : -0.2))
  )

  if (next === 1) {
    setImageOffset({ x: 0, y: 0 })
  }

  return next
})
  }}
>
   <div className="relative z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur-md">
  <p className="truncate text-sm font-medium text-white">
    {previewImage.name}
  </p>

  <div className="flex items-center gap-2">
    <button
      type="button"
     onClick={() => {
  setImageZoom((prev) => {
    const next = Math.max(1, prev - 0.25)

    if (next === 1) {
      setImageOffset({ x: 0, y: 0 })
    }

    return next
  })
}}
      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white transition hover:bg-white/10"
    >
      −
    </button>

    <span className="min-w-[52px] text-center text-xs text-white/70">
      {Math.round(imageZoom * 100)}%
    </span>

    <button
      type="button"
      onClick={() => setImageZoom((prev) => Math.min(5, prev + 0.25))}
      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white transition hover:bg-white/10"
    >
      +
    </button>

    <button
      type="button"
  onClick={() => {
  setPreviewImage(null)
  setImageZoom(1)
  setImageOffset({ x: 0, y: 0 })
  setIsPanningImage(false)
}}
      className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
    >
      <X className="h-5 w-5" />
    </button>
  </div>
</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewImage.url}
        alt={previewImage.name}
        className={`max-h-[80vh] w-full object-contain ${
        isPanningImage ? '' : 'transition-transform duration-200'
        }`}
style={{
  transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${imageZoom})`,
 cursor: imageZoom > 1 ? (isPanningImage ? 'grabbing' : 'grab') : 'default',
}}
onMouseDown={(e) => {
  if (imageZoom <= 1) return

  e.preventDefault()

  setIsPanningImage(true)

  setPanStart({
    x: e.clientX - imageOffset.x,
    y: e.clientY - imageOffset.y,
  })
}}

 onMouseMove={(e) => {
  if (!isPanningImage || imageZoom <= 1) return

  const maxOffset = 220 * imageZoom

  setImageOffset({
    x: Math.max(-maxOffset, Math.min(maxOffset, e.clientX - panStart.x)),
    y: Math.max(-maxOffset, Math.min(maxOffset, e.clientY - panStart.y)),
  })
}}

onMouseUp={() => setIsPanningImage(false)}

onMouseLeave={() => setIsPanningImage(false)}

draggable={false}
     />
    </div>
  </div>
)}
</div>
)}
