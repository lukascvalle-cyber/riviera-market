import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useVendorMenu } from '../../hooks/useVendorMenu'
import { MenuItemCard } from '../../components/vendor/MenuItemCard'
import { MenuItemForm } from '../../components/vendor/MenuItemForm'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import type { Product } from '../../types'

export function MenuManagementPage() {
  const { vendor } = useAuth()
  const { products, loading, toggleAvailability, refresh } = useVendorMenu(vendor?.id ?? null)
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | undefined>()

  function openCreate() { setEditProduct(undefined); setModalOpen(true) }
  function openEdit(p: Product) { setEditProduct(p); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditProduct(undefined) }

  async function handleToggle(id: string, available: boolean) {
    await toggleAvailability(id, available)
    toast(available ? 'Produto disponível' : 'Produto pausado', 'info')
  }

  if (!vendor) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-semibold text-gray-900">Meu cardápio</h2>
        <Button size="sm" onClick={openCreate}>+ Adicionar</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-gray-500 font-body mb-4">O seu cardápio está vazio</p>
          <Button onClick={openCreate}>Criar primeiro produto</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map(p => (
            <MenuItemCard key={p.id} product={p} editable onEdit={openEdit} onToggle={handleToggle} />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editProduct ? 'Editar produto' : 'Novo produto'}>
        <MenuItemForm
          vendorId={vendor.id}
          product={editProduct}
          onSuccess={() => { closeModal(); refresh() }}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  )
}
