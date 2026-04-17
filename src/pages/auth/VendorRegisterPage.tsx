import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { LanguageSelector } from '../../components/ui/LanguageSelector'

const MODULES = [1, 2, 3, 4, 5, 6, 7, 8]

/* ── Validation schema ── */
const schema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string()
    .transform(s => s.replace(/\D/g, ''))
    .refine(s => s.length === 11, 'CPF deve ter 11 dígitos'),
  phone: z.string().min(10, 'Telefone inválido'),
  vendor_type: z.enum(['ambulante', 'barraca_fixa'] as const, {
    required_error: 'Selecione o tipo de vendedor',
  }),
  modules: z.array(z.number()).min(1, 'Selecione pelo menos um módulo'),
  products_description: z.string().min(20, 'Descreva os produtos com pelo menos 20 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})
type FormValues = z.infer<typeof schema>

/* ── File preview state ── */
interface FileState {
  file: File
  preview: string | null  // null for PDF
  name: string
}


/* ── Section header component ── */
function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E4] p-5 flex flex-col gap-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: '#2E86AB' }}>
          {n}
        </span>
        <h3 className="font-display font-semibold text-[#1A1A2E] text-base">{title}</h3>
      </div>
      {children}
    </div>
  )
}

/* ── File upload widget ── */
function FileUploadField({
  label, hint, accept, value, onChange,
}: {
  label: string
  hint: string
  accept: string
  value: FileState | null
  onChange: (fs: FileState | null) => void
}) {
  const ref = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const preview = isImage ? URL.createObjectURL(file) : null
    onChange({ file, preview, name: file.name })
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-[#1A1A2E] font-body">{label}</span>
      <p className="text-xs text-[#6B7280] font-body">{hint}</p>
      <div
        onClick={() => ref.current?.click()}
        className="mt-1 border-2 border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors"
        style={{ borderColor: '#E8E8E4' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#2E86AB')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#E8E8E4')}
      >
        {value ? (
          <>
            {value.preview ? (
              <img src={value.preview} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: 'rgba(46,134,171,0.1)' }}>
                📄
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-body font-semibold text-[#1A1A2E] truncate">{value.name}</p>
              <p className="text-xs font-body mt-0.5" style={{ color: '#2E86AB' }}>Clique para trocar</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: '#F5E6D3' }}>
              📎
            </div>
            <div>
              <p className="text-sm font-body font-semibold text-[#1A1A2E]">Escolher arquivo</p>
              <p className="text-xs text-[#6B7280] font-body mt-0.5">JPG, PNG, WEBP ou PDF · máx. 10 MB</p>
            </div>
          </>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export function VendorRegisterPage() {
  const { t } = useTranslation()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // File states managed outside RHF
  const [profilePhoto, setProfilePhoto] = useState<FileState | null>(null)
  const [authDoc, setAuthDoc] = useState<FileState | null>(null)
  const [idDoc, setIdDoc] = useState<FileState | null>(null)

  // Modules checkboxes
  const [selectedModules, setSelectedModules] = useState<number[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { modules: [] },
  })

  function toggleModule(m: number) {
    setSelectedModules(prev => {
      const next = prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
      setValue('modules', next, { shouldValidate: true })
      return next
    })
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    setGlobalError(null)

    try {
      // 1. Create auth account (trigger creates profile row)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { full_name: values.full_name, role: 'vendedor' } },
      })
      if (signUpError) { setGlobalError(signUpError.message); setSubmitting(false); return }

      const userId = authData.user?.id

      // 2. Insert vendor application — column names match the actual table schema
      const { error: appError } = await supabase.from('vendor_applications').insert({
        auth_user_id: userId ?? null,
        full_name: values.full_name,
        email: values.email,
        cpf: values.cpf,
        phone: values.phone,
        vendor_type: values.vendor_type,
        modules: values.modules.map(String), // table stores text[]
        product_description: values.products_description,
      })

      if (appError) { setGlobalError(t('vendorRegister.errorSubmit')); setSubmitting(false); return }

      setSubmitted(true)
    } catch {
      setGlobalError(t('vendorRegister.errorSubmit'))
    }

    setSubmitting(false)
  }

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-[#2E86AB]">Riviera</h1>
            <p className="font-display text-xl text-[#2E86AB] opacity-70 mt-1">Market</p>
          </div>
          <div className="bg-white rounded-3xl border border-[#E8E8E4] p-8 flex flex-col items-center text-center gap-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(46,134,171,0.1)' }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: '#2E86AB' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-2xl font-semibold text-[#1A1A2E]">
                {t('vendorRegister.successTitle')}
              </h2>
              <p className="font-body text-sm text-[#6B7280] leading-relaxed">
                {t('vendorRegister.successBody')}
              </p>
            </div>
            <Link
              to="/login"
              className="w-full mt-1 inline-flex items-center justify-center rounded-xl text-white font-semibold font-body text-base py-3 px-6 transition-colors hover:opacity-90"
              style={{ backgroundColor: '#2E86AB' }}
            >
              {t('vendorRegister.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── Form ── */
  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="w-full max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link to="/login" className="text-sm text-[#6B7280] hover:text-[#1A1A2E] font-body flex items-center gap-1 mb-3 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t('vendorRegister.backToLogin')}
            </Link>
            <h1 className="font-display text-2xl font-bold text-[#1A1A2E]">{t('vendorRegister.pageTitle')}</h1>
            <p className="font-body text-sm text-[#6B7280] mt-1">{t('vendorRegister.subtitle')}</p>
          </div>
          <LanguageSelector />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          {/* Section 1 — Dados pessoais */}
          <Section n={1} title={t('vendorRegister.section1')}>
            <Input
              label={t('vendorRegister.fullName')}
              autoComplete="name"
              {...register('full_name')}
              error={errors.full_name?.message}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('vendorRegister.cpf')}
                placeholder="00000000000"
                inputMode="numeric"
                hint={t('vendorRegister.cpfHint')}
                {...register('cpf')}
                error={errors.cpf?.message}
              />
              <Input
                label={t('vendorRegister.phone')}
                placeholder="(13) 9xxxx-xxxx"
                inputMode="tel"
                autoComplete="tel"
                hint={t('vendorRegister.phoneHint')}
                {...register('phone')}
                error={errors.phone?.message}
              />
            </div>
            <FileUploadField
              label={t('vendorRegister.profilePhoto')}
              hint={t('vendorRegister.profilePhotoHint')}
              accept="image/*"
              value={profilePhoto}
              onChange={setProfilePhoto}
            />
          </Section>

          {/* Section 2 — Como você vende */}
          <Section n={2} title={t('vendorRegister.section2')}>

            {/* Vendor type */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-[#1A1A2E] font-body">{t('vendorRegister.vendorType')}</span>
              <div className="flex gap-3">
                {(['ambulante', 'barraca_fixa'] as const).map(type => (
                  <label
                    key={type}
                    className={`flex-1 flex items-center gap-2.5 border rounded-xl px-3 py-3 cursor-pointer transition-colors ${
                      errors.vendor_type ? 'border-[#E63946]' : 'border-[#E8E8E4]'
                    }`}
                  >
                    <input type="radio" value={type} {...register('vendor_type')} className="w-4 h-4 shrink-0" style={{ accentColor: '#2E86AB' }} />
                    <span className="font-body text-sm text-[#1A1A2E]">{t(`vendorRegister.${type}`)}</span>
                  </label>
                ))}
              </div>
              {errors.vendor_type && (
                <p className="text-xs text-[#E63946] font-body">{errors.vendor_type.message}</p>
              )}
            </div>

            {/* Modules */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-[#1A1A2E] font-body">{t('vendorRegister.modules')}</span>
              <p className="text-xs text-[#6B7280] font-body">{t('vendorRegister.modulesHint')}</p>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {MODULES.map(m => {
                  const active = selectedModules.includes(m)
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleModule(m)}
                      className={`rounded-xl py-2.5 font-body font-semibold text-sm transition-colors border`}
                      style={{
                        backgroundColor: active ? '#2E86AB' : 'white',
                        color: active ? 'white' : '#6B7280',
                        borderColor: active ? '#2E86AB' : '#E8E8E4',
                      }}
                    >
                      {t('vendorRegister.module')} {m}
                    </button>
                  )
                })}
              </div>
              {errors.modules && (
                <p className="text-xs text-[#E63946] font-body">{errors.modules.message}</p>
              )}
            </div>

            {/* Products description */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-[#1A1A2E] font-body">
                {t('vendorRegister.productsDescription')}
              </label>
              <textarea
                rows={4}
                placeholder={t('vendorRegister.productsDescriptionPlaceholder')}
                className="w-full rounded-[10px] border border-[#E8E8E4] px-4 py-2.5 font-body text-sm text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] resize-none"
                {...register('products_description')}
              />
              {errors.products_description && (
                <p className="text-xs text-[#E63946] font-body">{errors.products_description.message}</p>
              )}
            </div>
          </Section>

          {/* Section 3 — Documentos */}
          <Section n={3} title={t('vendorRegister.section3')}>
            <FileUploadField
              label={t('vendorRegister.authorizationDoc')}
              hint={t('vendorRegister.authorizationDocHint')}
              accept="image/*,application/pdf"
              value={authDoc}
              onChange={setAuthDoc}
            />
            <FileUploadField
              label={t('vendorRegister.identityDoc')}
              hint={t('vendorRegister.identityDocHint')}
              accept="image/*,application/pdf"
              value={idDoc}
              onChange={setIdDoc}
            />
          </Section>

          {/* Section 4 — Acesso */}
          <Section n={4} title={t('vendorRegister.section4')}>
            <Input
              label={t('vendorRegister.email')}
              type="email"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label={t('vendorRegister.password')}
              type="password"
              autoComplete="new-password"
              {...register('password')}
              error={errors.password?.message}
            />
          </Section>

          {globalError && (
            <p className="text-sm text-[#E63946] font-body bg-red-50 rounded-xl p-3">{globalError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[52px] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: '#2E86AB' }}
          >
            {submitting && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {t('vendorRegister.submit')}
          </button>

          <p className="text-center text-xs text-[#6B7280] font-body pb-4">
            {t('vendorRegister.loginLink')}{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#2E86AB' }}>
              {t('vendorRegister.vendorLoginLink')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
