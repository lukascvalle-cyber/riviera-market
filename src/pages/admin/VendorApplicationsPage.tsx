import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import type { VendorApplication, VendorApplicationStatus } from '../../types'

const STATUS_BADGE: Record<VendorApplicationStatus, string> = {
  pending: 'bg-[#F5E6D3] text-[#2E86AB]',
  approved: 'bg-[#52B788]/15 text-[#52B788]',
  rejected: 'bg-red-100 text-[#E63946]',
}


/* ── Reject modal ── */
function RejectModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
        <h3 className="font-display text-lg font-semibold text-[#1A1A2E]">
          {t('admin.rejectAction')}
        </h3>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-[#1A1A2E] font-body">
            {t('admin.rejectReason')}
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={t('admin.rejectReasonPlaceholder')}
            className="w-full rounded-[10px] border border-[#E8E8E4] px-4 py-2.5 font-body text-sm text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] resize-none"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl font-body text-sm font-semibold text-[#6B7280] hover:bg-[#FAFAF8] transition-colors"
          >
            {t('common.cancel')}
          </button>
          <Button
            size="sm"
            variant="danger"
            loading={loading}
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            {t('admin.confirmReject')}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── Application card ── */
function ApplicationCard({
  app,
  onApprove,
  onReject,
}: {
  app: VendorApplication
  onApprove: (app: VendorApplication) => void
  onReject: (app: VendorApplication) => void
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const isPending = app.status === 'pending'

  const createdAt = new Date(app.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E4] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-[#FAFAF8] transition-colors"
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: '#F5E6D3' }}>
          🙋
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-[#1A1A2E] truncate">{app.full_name}</p>
          <p className="text-xs text-[#6B7280] font-body truncate">{app.email} · {createdAt}</p>
        </div>

        <Badge className={STATUS_BADGE[app.status]}>
          {t(`admin.status_${app.status}`)}
        </Badge>

        <svg
          className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[#E8E8E4] px-4 pb-5 pt-4 flex flex-col gap-4">

          {/* Grid of info fields */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="text-xs text-[#6B7280] font-body uppercase tracking-wide">{t('admin.cpf')}</p>
              <p className="font-body text-sm font-semibold text-[#1A1A2E] mt-0.5">{app.cpf}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280] font-body uppercase tracking-wide">{t('admin.phone')}</p>
              <p className="font-body text-sm font-semibold text-[#1A1A2E] mt-0.5">{app.phone}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280] font-body uppercase tracking-wide">{t('admin.vendorType')}</p>
              <p className="font-body text-sm font-semibold text-[#1A1A2E] mt-0.5">
                {t(`vendorRegister.${app.vendor_type}`)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280] font-body uppercase tracking-wide">{t('admin.modules')}</p>
              <p className="font-body text-sm font-semibold text-[#1A1A2E] mt-0.5">
                {app.modules.slice().sort((a, b) => Number(a) - Number(b)).join(', ')}
              </p>
            </div>
          </div>

          {/* Products description */}
          <div>
            <p className="text-xs text-[#6B7280] font-body uppercase tracking-wide mb-1">
              {t('vendorRegister.productsDescription')}
            </p>
            <p className="font-body text-sm text-[#1A1A2E] leading-relaxed">{app.product_description}</p>
          </div>

          {/* Actions */}
          {isPending && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="secondary" onClick={() => onApprove(app)}>
                ✓ {t('admin.approveAction')}
              </Button>
              <Button size="sm" variant="danger" onClick={() => onReject(app)}>
                ✕ {t('admin.rejectAction')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export function VendorApplicationsPage() {
  const { t } = useTranslation()
  const toast = useToast()

  const [applications, setApplications] = useState<VendorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<VendorApplicationStatus>('pending')

  const [rejectTarget, setRejectTarget] = useState<VendorApplication | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  async function fetchApplications() {
    setLoading(true)
    const { data } = await supabase
      .from('vendor_applications')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setApplications(data as VendorApplication[])
    setLoading(false)
  }

  useEffect(() => { fetchApplications() }, [])

  async function handleApprove(app: VendorApplication) {
    setActionLoading(true)

    // 1. Mark application as approved
    const { error: appError } = await supabase
      .from('vendor_applications')
      .update({ status: 'approved' })
      .eq('id', app.id)

    // 2. Create (or update) vendor row so the vendor can log in and operate
    if (!appError && app.auth_user_id) {
      await supabase
        .from('vendors')
        .upsert(
          {
            profile_id: app.auth_user_id,
            display_name: app.full_name,
            category: 'outros',
            is_active: false,
            is_approved: true,
          },
          { onConflict: 'profile_id' },
        )
    }

    if (appError) {
      toast(t('admin.vendorUpdateError'), 'error')
    } else {
      toast(t('admin.approveSuccess'), 'success')
      setApplications(prev =>
        prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a),
      )
    }
    setActionLoading(false)
  }

  async function handleReject(app: VendorApplication, _reason: string) {
    setActionLoading(true)
    const { error } = await supabase
      .from('vendor_applications')
      .update({ status: 'rejected' })
      .eq('id', app.id)

    if (error) {
      toast(t('admin.vendorUpdateError'), 'error')
    } else {
      toast(t('admin.rejectSuccess'), 'success')
      setApplications(prev =>
        prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a),
      )
    }
    setRejectTarget(null)
    setActionLoading(false)
  }

  const filtered = applications.filter(a => a.status === activeTab)

  const counts = {
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#1A1A2E]">{t('admin.applicationsTitle')}</h1>
        <p className="font-body text-sm text-[#6B7280] mt-1">{t('admin.applicationsSubtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1 mb-5" style={{ backgroundColor: 'rgba(245,230,211,0.4)' }}>
        {(['pending', 'approved', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg font-body text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === tab
                ? 'bg-white text-[#1A1A2E] shadow-sm'
                : 'text-[#6B7280] hover:text-[#1A1A2E]'
            }`}
          >
            {t(`admin.tab_${tab}`)}
            {counts[tab] > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                tab === 'pending' ? 'bg-[#F5E6D3] text-[#2E86AB]' :
                tab === 'approved' ? 'bg-[#52B788]/15 text-[#52B788]' :
                'bg-red-100 text-[#E63946]'
              }`}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-[#6B7280] font-body">{t('admin.noApplications')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(app => (
            <ApplicationCard
              key={app.id}
              app={app}
              onApprove={handleApprove}
              onReject={setRejectTarget}
            />
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          loading={actionLoading}
          onConfirm={reason => handleReject(rejectTarget, reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  )
}
