export type UserRole = 'frequentador' | 'vendedor' | 'administrador'

export type VendorCategory =
  | 'bebidas'
  | 'comidas'
  | 'sorvete'
  | 'artesanato'
  | 'equipamentos'
  | 'outros'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'delivering'
  | 'delivered'
  | 'cancelled'

export interface Module {
  id: number
  number: number
  name: string
}

export interface Building {
  id: number
  module_id: number
  name: string
}

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  phone: string | null
  avatar_url: string | null
  module_id: number | null
  building_id: number | null
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  profile_id: string
  display_name: string
  category: VendorCategory
  description: string | null
  logo_url: string | null
  is_active: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
}

export interface VendorWithLocation extends Vendor {
  location?: VendorLocation
  profile?: Pick<Profile, 'full_name' | 'phone'>
}

export interface Product {
  id: string
  vendor_id: string
  name: string
  description: string | null
  price_brl: number
  photo_url: string | null
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface VendorLocation {
  vendor_id: string
  latitude: number
  longitude: number
  accuracy: number | null
  heading: number | null
  updated_at: string
}

export interface Order {
  id: string
  vendor_id: string
  frequentador_id: string
  status: OrderStatus
  delivery_location: string | null
  module_number: number | null
  building_name: string | null
  apartment_number: string | null
  payment_method: string | null
  total_brl: number
  notes: string | null
  created_at: string
  updated_at: string
  vendor?: Pick<Vendor, 'display_name' | 'category' | 'logo_url'>
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  product_name: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface OrderMessage {
  id: string
  order_id: string
  sender_id: string
  message: string
  created_at: string
}

export interface VendorReview {
  id: string
  order_id: string
  vendor_id: string
  buyer_id: string
  rating: number
  review_text: string | null
  created_at: string
}

export type VendorApplicationStatus = 'pending' | 'approved' | 'rejected'
export type VendorType = 'ambulante' | 'barraca_fixa'

export interface VendorApplication {
  id: string
  auth_user_id: string | null
  full_name: string
  email: string
  cpf: string
  phone: string
  vendor_type: VendorType
  modules: string[]
  product_description: string
  status: VendorApplicationStatus
  created_at: string
}
