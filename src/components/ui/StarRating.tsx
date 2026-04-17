interface StarRatingProps {
  rating: number
  maxStars?: number
  interactive?: boolean
  onRate?: (n: number) => void
  size?: 'sm' | 'md' | 'lg'
}

const SIZE = { sm: 'text-base', md: 'text-2xl', lg: 'text-3xl' }

export function StarRating({
  rating,
  maxStars = 5,
  interactive = false,
  onRate,
  size = 'md',
}: StarRatingProps) {
  return (
    <div className={`flex items-center gap-0.5 ${SIZE[size]}`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i < Math.round(rating)
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(i + 1)}
            className={interactive ? 'cursor-pointer transition-transform active:scale-90 focus:outline-none' : 'cursor-default'}
            aria-label={`${i + 1} estrela${i + 1 > 1 ? 's' : ''}`}
          >
            <span style={{ color: filled ? '#2E86AB' : '#E8E8E4' }}>
              {filled ? '★' : '☆'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
