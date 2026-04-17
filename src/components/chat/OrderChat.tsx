import { useState, useRef, useEffect } from 'react'
import { useOrderMessages } from '../../hooks/useOrderMessages'
import { Spinner } from '../ui/Spinner'
import type { OrderStatus } from '../../types'

interface OrderChatProps {
  open: boolean
  onClose: () => void
  orderId: string
  currentUserId: string
  orderStatus: OrderStatus
  /** Display name shown in the header (vendor name for buyer, or "Cliente" for vendor) */
  partnerName?: string
}

export function OrderChat({
  open,
  onClose,
  orderId,
  currentUserId,
  orderStatus,
  partnerName,
}: OrderChatProps) {
  const { messages, loading, sendMessage } = useOrderMessages(
    open ? orderId : null,
    currentUserId,
  )
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [visible, setVisible] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isClosed = orderStatus === 'delivered' || orderStatus === 'cancelled'

  useEffect(() => {
    if (open) {
      setTimeout(() => setVisible(true), 10)
    } else {
      setVisible(false)
      setInput('')
    }
  }, [open])

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    await sendMessage(text)
    setInput('')
    setSending(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full bg-white rounded-t-[20px] shadow-2xl flex flex-col"
        style={{
          height: '80vh',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-8 h-1 rounded-full bg-[#E8E8E4]" />
        </div>

        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-[#E8E8E4] flex items-center justify-between">
          <div>
            <p className="font-display font-semibold text-[#1A1A2E]">
              {partnerName ?? 'Chat do pedido'}
            </p>
            <p className="text-xs text-[#6B7280] font-body">
              #{orderId.slice(-8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F5E6D3]/60 flex items-center justify-center text-[#6B7280] hover:bg-[#F5E6D3] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Completed / cancelled banner */}
        {isClosed && (
          <div className="shrink-0 px-4 py-2 border-b border-[#E8E8E4] text-center"
            style={{ backgroundColor: '#F5E6D3' }}
          >
            <p className="text-xs font-body" style={{ color: '#2E86AB' }}>
              {orderStatus === 'delivered'
                ? '✓ Pedido concluído'
                : '✕ Pedido cancelado'}{' '}
              — histórico somente leitura
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2" style={{ backgroundColor: '#FAFAF8' }}>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-[#6B7280] font-body text-sm py-8">
              Sem mensagens ainda. Diga olá! 👋
            </p>
          ) : (
            messages.map(msg => {
              const isOwn = msg.sender_id === currentUserId
              const time = new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 ${
                      isOwn
                        ? 'text-white rounded-[16px_16px_4px_16px]'
                        : 'text-[#1A1A2E] rounded-[16px_16px_16px_4px]'
                    }`}
                    style={{
                      backgroundColor: isOwn ? '#2E86AB' : '#F5E6D3',
                    }}
                  >
                    <p className="font-body text-sm leading-relaxed break-words">
                      {msg.message}
                    </p>
                    <p
                      className={`text-[11px] mt-1 text-right`}
                      style={{ color: isOwn ? 'rgba(255,255,255,0.6)' : '#6B7280' }}
                    >
                      {time}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input — hidden for closed orders */}
        {!isClosed && (
          <div
            className="shrink-0 px-4 pt-3 pb-4 bg-white border-t border-[#E8E8E4] flex items-end gap-2"
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mensagem…"
              className="flex-1 rounded-2xl border border-[#E8E8E4] px-4 py-2.5 font-body text-sm text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] resize-none leading-relaxed"
              style={{ maxHeight: 96, overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
              style={{ backgroundColor: '#2E86AB' }}
              aria-label="Enviar mensagem"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
