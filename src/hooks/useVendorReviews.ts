import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { VendorReview } from '../types'

export function useVendorReviews(vendorId: string | null) {
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!vendorId) { setLoading(false); return }
    const { data } = await supabase
      .from('vendor_reviews')
      .select('rating')
      .eq('vendor_id', vendorId)
    if (data && data.length > 0) {
      const sum = data.reduce((acc, r) => acc + r.rating, 0)
      setAvgRating(Math.round((sum / data.length) * 10) / 10)
      setReviewCount(data.length)
    } else {
      setAvgRating(null)
      setReviewCount(0)
    }
    setLoading(false)
  }, [vendorId])

  useEffect(() => { fetchStats() }, [fetchStats])

  return { avgRating, reviewCount, loading, refresh: fetchStats }
}

export async function getOrderReview(
  orderId: string,
  buyerId: string,
): Promise<VendorReview | null> {
  const { data } = await supabase
    .from('vendor_reviews')
    .select('*')
    .eq('order_id', orderId)
    .eq('buyer_id', buyerId)
    .maybeSingle()
  return data as VendorReview | null
}

export async function submitReview(
  orderId: string,
  vendorId: string,
  buyerId: string,
  rating: number,
  reviewText: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('vendor_reviews').insert({
    order_id: orderId,
    vendor_id: vendorId,
    buyer_id: buyerId,
    rating,
    review_text: reviewText.trim() || null,
  })
  if (error) {
    console.error('[submitReview]', error)
    return { error: error.message }
  }
  return { error: null }
}
