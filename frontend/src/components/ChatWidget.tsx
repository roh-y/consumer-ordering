import { useRef, useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { chatService } from '../services/chatService'

export default function ChatWidget() {
  const { isAuthenticated } = useAuthStore()
  const { messages, sessionId, isOpen, isLoading, addMessage, setSessionId, setOpen, setLoading, clearChat } = useChatStore()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  if (!isAuthenticated) return null

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    addMessage('user', text)
    setLoading(true)

    try {
      const response = await chatService.sendMessage(text, sessionId || undefined)
      addMessage('assistant', response.message)
      if (response.sessionId) setSessionId(response.sessionId)
    } catch {
      addMessage('assistant', 'Sorry, something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating chat bubble — larger with drop shadow for visibility */}
      {!isOpen && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 w-14 h-14 bg-[--color-primary] hover:bg-[--color-primary-hover] active:scale-95 text-white rounded-full flex items-center justify-center transition-all duration-150 z-50 focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2"
          style={{ boxShadow: '0 4px 14px rgba(255, 56, 92, 0.45)' }}
          aria-label="Open chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat panel — full-screen on mobile, card on desktop */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-96 sm:h-[500px] sm:rounded-2xl bg-white sm:shadow-2xl sm:border sm:border-[--color-border-default] flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[--color-primary] text-white sm:rounded-t-2xl shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="font-medium text-sm">Support Assistant</span>
            </div>
            <div className="flex gap-1 items-center">
              <button
                onClick={clearChat}
                className="text-white/70 hover:text-white text-xs min-h-[44px] px-3 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-primary] rounded"
                title="Clear chat"
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-primary] rounded"
                aria-label="Close chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-[--color-text-tertiary] text-sm mt-8">
                <p className="font-medium text-[--color-text-secondary] mb-1">Hi! How can I help?</p>
                <p>Ask about plans, orders, or billing.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[--color-primary] text-white'
                      : 'bg-[--color-bg-secondary] text-[--color-text-primary]'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[--color-bg-secondary] rounded-2xl px-4 py-2.5 text-sm text-[--color-text-tertiary]">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input — safe area padding on mobile for notched devices */}
          <div className="px-4 py-3 border-t border-[--color-border-subtle] shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={isLoading}
                className="flex-1 border border-[--color-border-default] rounded-full px-4 h-11 text-base sm:text-sm focus:outline-none focus:border-[--color-gray-900] focus:ring-1 focus:ring-[--color-gray-900] disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-[--color-primary] hover:bg-[--color-primary-hover] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full w-11 h-11 flex items-center justify-center shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
