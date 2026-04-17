import { useEffect, useState } from 'react'
import { StarRating } from '../ui/StarRating'
import { getOrderReview, submitReview } from '../../hooks/useVendorReviews'

interface ReviewSheetProps {
  open: boolean
  onClose: () => void
  orderId: string
  vendorId: string
  vendorName: string
  currentUserId: string
  onSubmitted?: () => void
}

export function ReviewSheet({
  open,
  onClose,
  orderId,
  vendorId,
  vendorName,
  currentUserId,
  onSubmitted,
}: ReviewSheetProps) {
  const [visible, setVisible] = useState(false)
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [existingRating, setExistingRating] = useState<number | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Slide-up animation
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
      setRating(0)
      setText('')
      setSubmitted(false)
      setError(null)
    }
  }, [open])

  // Check if already reviewed when opening
  useEffect(() => {
    if (!open) return
    setLoadingExisting(true)
    getOrderReview(orderId, currentUserId).then(review => {
      if (review) setExistingRating(review.rating)
      setLoadingExisting(false)
    })
  }, [open, orderId, currentUserId])

  async function handleSubmit() {
    if (rating === 0 || submitting) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await submitReview(orderId, vendorId, currentUserId, rating, text)
    setSubmitting(false)
    if (err) {
      setError('Não foi possível enviar a avaliação. Tente novamente.')
      return
    }
    setSubmitted(true)
    onSubmitted?.()
  }

  if (!open) return null

  const isReadOnly = existingRating !== null
  const displayRating = isReadOnly ? existingRating : rating

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
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-out',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-8 h-1 rounded-full bg-[#E8E8E4]" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 flex items-center justify-between border-b border-[#E8E8E4]">
          <div>
            <p className="font-display font-semibold text-[#1A1A2E]">
              {isReadOnly ? 'Sua avaliação' : 'Avaliar vendedor'}
            </p>
            <p className="text-sm text-[#6B7280] font-body mt-0.5">{vendorName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#F5E6D3] transition-colors"
            style={{ backgroundColor: '#F5E6D3' }}
          >
            ✕
          </button>
        </div>

        <div className="px-5 pt-5 pb-2 flex flex-col gap-5">
          {loadingExisting ? (
            <div className="py-8 text-center text-[#6B7280] font-body text-sm">Carregando…</div>
          ) : submitted ? (
            /* ── Thank-you state ── */
            <div className="py-6 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: 'rgba(82,183,136,0.12)' }}>
                ✓
              </div>
              <p className="font-display font-bold text-[#1A1A2E] text-lg text-center">
                Obrigado pela avaliação!
              </p>
              <StarRating rating={rating} size="lg" />
            </div>
          ) : isReadOnly ? (
            /* ── Read-only: already reviewed ── */
            <div className="py-4 flex flex-col items-center gap-3">
              <p className="text-sm text-[#6B7280] font-body text-center">
                Você já avaliou este pedido.
              </p>
              <StarRating rating={displayRating} size="lg" />
            </div>
          ) : (
            /* ── Interactive rating form ── */
            <>
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-body text-[#6B7280]">
                  {rating === 0
                    ? 'Toque nas estrelas para avaliar'
                    : ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente!'][rating]}
                </p>
                <StarRating
                  rating={displayRating}
                  interactive
                  onRate={setRating}
                  size="lg"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A2E] font-body">
                  Comentário <span className="font-normal text-[#6B7280]">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={200}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Deixe um comentário…"
                  className="w-full rounded-[10px] border border-[#E8E8E4] px-4 py-3 font-body text-sm text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] resize-none"
                />
                <p className="text-xs text-[#6B7280] font-body text-right">{text.length}/200</p>
              </div>

              {error && (
                <p className="text-sm font-body text-center" style={{ color: '#E63946' }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="w-full h-[52px] text-white font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: '#2E86AB' }}
              >
                {submitting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                Enviar avaliação
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
