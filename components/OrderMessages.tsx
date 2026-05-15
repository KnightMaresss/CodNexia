'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from './ui/button'
import { showToast } from './ui/toast'
import { SoundNotification } from '@/components/SoundNotification'
import { 
  Send,
  Loader2,
  CheckCheck,
  X,
  Paperclip  
}
  from 'lucide-react'
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

export function OrderMessages({ orderId, userName }: { orderId: string; userName?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [playMsgSound, setPlayMsgSound] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?orderId=${orderId}`)
      const data = await res.json()
      if (data.success) {
        if (data.messages.length > messages.length && messages.length > 0) {
          setPlayMsgSound(true)
          setTimeout(() => setPlayMsgSound(false), 100)
        }
        setMessages(data.messages)
      }
    } catch {}
    setLoading(false)
  }, [orderId, messages.length])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages()
  }, [fetchMessages])



useEffect(() => {
  const interval = setInterval(() => {
    fetchMessages()
    fetch('/api/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    }).catch(() => {})
  }, 2000)

  return () => clearInterval(interval)
}, [fetchMessages, orderId])



useEffect(() => {
  // Scroll to bottom of chat messages only
  const messagesContainer = document.querySelector('.overflow-y-auto')
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }
}, [messages])


  useEffect(() => {
    fetch('/api/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    }).catch(() => {})
  }, [orderId])


    // Handle paste for images
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
        setSelectedFile(null)
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
        setNewMessage('')
        inputRef.current?.focus()
        fetch('/api/messages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        }).catch(() => {})
      } else {
        showToast(data.error || 'Failed to send', 'error')
      }
    } catch {
      showToast('Failed to send message', 'error')
    }
    setSending(false)
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
    return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[400px] bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-hidden border border-border">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-border bg-white dark:bg-slate-900 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">C</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Codnexia Support</p>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Online
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                <Send className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-foreground">Start the conversation</p>
              <p className="text-xs text-muted-foreground mt-1">Send a message to get help with your order</p>
            </div>
          </div>
        ) : (
            messages.map((msg, index) => {
            const isAdmin = msg.senderRole === 'admin'
            const showAvatar = index === 0 || messages[index - 1].senderRole !== msg.senderRole
            const showDate = index === 0 || 
              new Date(msg.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString()

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="text-xs bg-slate-200 dark:bg-slate-800 text-muted-foreground px-3 py-1 rounded-full">
                      {getDateLabel(msg.createdAt)}
                    </span>
                  </div>
                )}
              <div className={`flex gap-2 ${!isAdmin ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isAdmin ? 'bg-blue-600' : 'bg-green-600'
                } ${!showAvatar ? 'invisible' : ''}`}>
                  <span className="text-white text-xs font-bold">
                  {isAdmin ? 'C' : (userName?.charAt(0).toUpperCase() || 'Y')}
                  </span>
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] ${!isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isAdmin
                      ? 'bg-white dark:bg-slate-800 text-foreground rounded-tl-md shadow-sm border border-border'
                      : 'bg-blue-600 text-white rounded-tr-md shadow-sm'
                  }`}>
                   {msg.message && <p>{msg.message}</p>}
                    {msg.fileUrl && (
                      <div className="mt-2">
                        {msg.fileType?.startsWith('image/') ? (
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img
                              src={msg.fileUrl}
                              alt={msg.fileName || 'Image'}
                              loading="lazy"
                              className="rounded-lg max-w-[250px] max-h-[250px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          </a>
                        ) : (
                           <a
                href={msg.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
              >
                <Paperclip className="h-3 w-3" />
                {msg.fileName || 'Download file'}
              </a>
            )}
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${!isAdmin ? 'justify-end' : ''}`}>
                    <p className="text-[10px] text-muted-foreground">
                      {formatTime(msg.createdAt)}
                    </p>
                    {!isAdmin && <CheckCheck className="h-3 w-3 text-blue-400" />}
                  </div>
                </div>
              </div>
             </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

            {/* Input Area */}
      {selectedFile && (
        <div className="px-3 pt-2 bg-white dark:bg-slate-900 flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 text-sm">
            <Paperclip className="h-4 w-4 text-blue-600" />
            <span className="text-foreground truncate max-w-[200px]">{selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)}>
              <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
            </button>
          </div>
        </div>
      )}
      <form onSubmit={handleSend} className="p-3 border-t border-border bg-white dark:bg-slate-900 flex gap-2 items-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Paperclip className="h-4 w-4 text-muted-foreground" />
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
          placeholder="Type your message..."
          className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-0 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500 outline-none"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          disabled={sending || (!newMessage.trim() && !selectedFile)}
          className="rounded-full w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
       <SoundNotification play={playMsgSound} type="chat" />
      </form>
    </div>
  )
}