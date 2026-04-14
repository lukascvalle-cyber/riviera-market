import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'

export function useVendorMenu(vendorId: string | null) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    if (!vendorId) { setLoading(false); return }
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('sort_order')
      .order('created_at')
    if (data) setProducts(data)
    setLoading(false)
  }, [vendorId])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  async function createProduct(payload: Omit<Product, 'id' | 'vendor_id' | 'created_at' | 'updated_at'>) {
    if (!vendorId) return null
    const { data, error } = await supabase
      .from('products')
      .insert({ ...payload, vendor_id: vendorId })
      .select()
      .single()
    if (!error && data) setProducts(prev => [...prev, data])
    return error ? null : data
  }

  async function updateProduct(id: string, payload: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setProducts(prev => prev.map(p => p.id === id ? data : p))
    return error ? null : data
  }

  async function deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) setProducts(prev => prev.filter(p => p.id !== id))
    return !error
  }

  async function toggleAvailability(id: string, is_available: boolean) {
    return updateProduct(id, { is_available })
  }

  return { products, loading, createProduct, updateProduct, deleteProduct, toggleAvailability, refresh: fetchProducts }
}
