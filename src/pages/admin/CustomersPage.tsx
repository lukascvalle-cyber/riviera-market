/*
 * SQL to run in Supabase SQL Editor before using this page:
 *
 * CREATE OR REPLACE FUNCTION admin_get_customers()
 * RETURNS TABLE (
 *   id uuid,
 *   full_name text,
 *   phone text,
 *   created_at timestamptz,
 *   email text,
 *   email_confirmed_at timestamptz
 * )
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * SET search_path = public
 * AS $$
 * BEGIN
 *   IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'administrador' THEN
 *     RAISE EXCEPTION 'Access denied';
 *   END IF;
 *   RETURN QUERY
 *   SELECT
 *     p.id,
 *     p.full_name,
 *     p.phone,
 *     p.created_at,
 *     u.email::text,
 *     u.email_confirmed_at
 *   FROM profiles p
 *   JOIN auth.users u ON u.id = p.id
 *   WHERE p.role = 'frequentador'
 *   ORDER BY p.created_at DESC;
 * END;
 * $$;
 */

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'

interface CustomerRow {
  id: string
  full_name: string
  phone: string | null
  created_at: string
  email: string
  email_confirmed_at: string | null
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [rpcUnavailable, setRpcUnavailable] = useState(false)

  useEffect(() => {
    supabase
      .rpc('admin_get_customers')
      .then(({ data, error }) => {
        if (error) {
          // RPC not yet created — fall back to plain profiles query (no email confirmation info)
          console.warn('[CustomersPage] admin_get_customers RPC unavailable, falling back:', error.message)
          setRpcUnavailable(true)
          return supabase
            .from('profiles')
            .select('id, full_name, phone, created_at')
            .eq('role', 'frequentador')
            .order('created_at', { ascending: false })
        }
        setCustomers((data as CustomerRow[]) ?? [])
        setLoading(false)
        return null
      })
      .then(result => {
        if (!result) return
        const { data } = result
        setCustomers(
          (data ?? []).map((p: { id: string; full_name: string; phone: string | null; created_at: string }) => ({
            ...p,
            email: '—',
            email_confirmed_at: null,
          })),
        )
        setLoading(false)
      })
  }, [])

  const confirmedCount = customers.filter(c => c.email_confirmed_at).length
  const pendingCount = customers.filter(c => !c.email_confirmed_at).length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold text-[#1A1A2E]">Clientes</h1>
        {!loading && (
          <div className="flex items-center gap-3 text-sm font-body">
            <span className="text-[#52B788] font-semibold">{confirmedCount} confirmados</span>
            {pendingCount > 0 && (
              <span className="font-semibold" style={{ color: '#B45309' }}>{pendingCount} pendentes</span>
            )}
          </div>
        )}
      </div>

      {rpcUnavailable && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm font-body" style={{ backgroundColor: 'rgba(245,230,211,0.8)', color: '#92400E' }}>
          ⚠️ Execute a função <code className="font-mono text-xs bg-white/60 px-1 rounded">admin_get_customers()</code> no SQL Editor do Supabase para ver o status de confirmação de email.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280] font-body">
          <p className="text-4xl mb-3">🏖️</p>
          <p>Nenhum cliente registado ainda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E8E4] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <table className="w-full">
            <thead className="border-b border-[#E8E8E4]" style={{ backgroundColor: '#FAFAF8' }}>
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide hidden md:table-cell">Telefone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide hidden lg:table-cell">Registado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E4]">
              {customers.map((c, idx) => (
                <tr
                  key={c.id}
                  className="hover:bg-[#FAFAF8] transition-colors"
                  style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAF8' }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: 'rgba(46,134,171,0.1)', color: '#2E86AB' }}>
                        {c.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold font-body text-[#1A1A2E] text-sm">{c.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-body text-[#6B7280] hidden sm:table-cell">{c.email}</td>
                  <td className="px-4 py-3 text-sm font-body text-[#6B7280] hidden md:table-cell">
                    {c.phone ?? <span className="text-[#E8E8E4]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.email_confirmed_at ? (
                      <span className="inline-flex items-center gap-1 text-xs font-body font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(82,183,136,0.12)', color: '#52B788' }}>
                        ✓ Confirmado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-body font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(180,83,9,0.1)', color: '#B45309' }}>
                        ✉ Email não confirmado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-body text-[#6B7280] hidden lg:table-cell">
                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
