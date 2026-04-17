import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface EmailConfirmationScreenProps {
  email: string
}

export function EmailConfirmationScreen({ email }: EmailConfirmationScreenProps) {
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function handleResend() {
    setResending(true)
    await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    setResent(true)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await supabase.auth.getSession()
    // Reload so AuthProvider re-reads the session and checks email_confirmed_at
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="w-full max-w-sm flex flex-col items-center gap-6 bg-white rounded-3xl p-8 border border-[#E8E8E4]" style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.08)' }}>

        {/* Envelope icon */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(46,134,171,0.1)' }}>
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#2E86AB" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <div className="text-center flex flex-col gap-2">
          <h1 className="font-display text-2xl font-bold text-[#1A1A2E]">Confirme seu email</h1>
          <p className="font-body text-sm text-[#6B7280] leading-relaxed">
            Enviamos um link de confirmação para{' '}
            <span className="font-semibold text-[#1A1A2E]">{email}</span>.
            Verifique sua caixa de entrada (e a pasta de spam) e clique no link para ativar sua conta.
          </p>
        </div>

        {resent && (
          <div className="w-full rounded-xl px-4 py-3 text-sm font-body text-center" style={{ backgroundColor: 'rgba(82,183,136,0.1)', color: '#52B788' }}>
            Email reenviado! Verifique sua caixa de entrada.
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleResend}
            disabled={resending || resent}
            className="w-full h-12 text-white font-semibold font-body rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2E86AB' }}
          >
            {resending ? 'Reenviando…' : resent ? 'Email enviado ✓' : 'Reenviar email de confirmação'}
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full text-sm font-body font-semibold transition-colors py-2"
            style={{ color: '#2E86AB' }}
          >
            {refreshing ? 'Verificando…' : 'Já confirmei, tentar novamente'}
          </button>
        </div>

        <p className="text-xs text-[#6B7280] font-body text-center">
          Logado como {email}.{' '}
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
            className="underline hover:text-[#1A1A2E]"
          >
            Sair
          </button>
        </p>
      </div>
    </div>
  )
}
