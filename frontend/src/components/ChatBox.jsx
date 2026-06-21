import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles } from 'lucide-react'
import { Button } from './UI'
import TypewriterText from './TypewriterText'

export default function ChatBox({ onSend, loading, messages, placeholder = 'Ask about your money or career...' }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  async function handleSubmit(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    await onSend(text)
  }

  return (
    <div className="flex h-[min(560px,70vh)] flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium">Upshift AI</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!messages.length && (
          <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
            Ask anything — debt payoff, budgeting, salary negotiation, career moves. I use your profile numbers when available.
          </div>
        )}
        {messages.map((msg, i) => {
          const shouldAnimate = msg.role === 'assistant' && msg.stream && i === messages.length - 1

          return (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent text-white'
                    : 'border border-border bg-surface text-text'
                }`}
              >
                {msg.role === 'user' ? (
                  msg.content.split('\n').map((line, j) => (
                    <p key={j} className={j > 0 ? 'mt-2' : ''}>{line}</p>
                  ))
                ) : (
                  <TypewriterText
                    text={msg.content}
                    animate={shouldAnimate}
                    onProgress={scrollToBottom}
                  />
                )}
              </div>
            </div>
          )
        })}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} className="gap-1 px-4">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
