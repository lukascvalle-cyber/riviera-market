# Riviera Market — Guia de Setup

## 1. Instalar Node.js

Descarrega e instala o Node.js LTS em: https://nodejs.org

Verifica a instalação:
```
node -v   # deve mostrar v20.x ou superior
npm -v    # deve mostrar v10.x ou superior
```

## 2. Instalar dependências

```bash
cd Documents/riviera-market
npm install
```

## 3. Criar projeto Supabase

1. Vai a https://supabase.com e cria uma conta
2. Cria um novo projeto ("riviera-market")
3. Aguarda a criação (1-2 minutos)
4. Em **Settings → API**, copia:
   - Project URL
   - anon public key

## 4. Executar migrações SQL

No Supabase, vai a **SQL Editor** e executa os ficheiros em ordem:

```
supabase/migrations/0001_create_profiles.sql
supabase/migrations/0002_create_vendors.sql
supabase/migrations/0003_create_products.sql
supabase/migrations/0004_create_orders.sql
supabase/migrations/0005_create_vendor_locations.sql
supabase/migrations/0006_rls_policies.sql
supabase/migrations/0007_auth_trigger.sql
supabase/migrations/0008_create_order_rpc.sql
```

Podes copiar o conteúdo de cada ficheiro e colar no SQL Editor, executando um a um.

## 5. Ativar Realtime

No Supabase, vai a **Database → Replication** e ativa a tabela `vendor_locations`.
(Opcional mas recomendado: ativar também `orders`)

## 6. Criar Storage Buckets

No Supabase, vai a **Storage** e cria dois buckets **públicos**:
- `vendor-logos` (para logos dos vendedores)
- `product-photos` (para fotos dos produtos)

Para cada bucket, em **Policies**, adiciona uma política pública de leitura:
```sql
-- Select policy (qualquer um pode ler)
bucket_id = 'vendor-logos'  -- ou 'product-photos'
-- Operation: SELECT
-- Policy: true
```

## 7. Obter token Mapbox

1. Cria conta em https://mapbox.com
2. Em **Tokens**, copia o token público padrão (começa com `pk.`)

## 8. Configurar variáveis de ambiente

Cria um ficheiro `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiLi4uIn0...
```

## 9. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Abre http://localhost:5173 no browser.

## 10. Criar o primeiro administrador

1. Regista uma conta como **Frequentador** (qualquer email)
2. No Supabase → **SQL Editor**, executa:

```sql
-- Muda o role do utilizador para administrador
UPDATE profiles
SET role = 'administrador'
WHERE id = 'UUID_DO_UTILIZADOR';  -- substitui pelo ID real
```

O ID podes encontrar em **Authentication → Users** no Supabase.

## 11. Fluxo de teste

1. **Administrador**: entra em `/admin`, vai a Vendedores e aprova o vendedor
2. **Vendedor**: regista conta como Vendedor → cria produtos → clica "Ir ao vivo"
3. **Frequentador**: regista conta como Frequentador → vê o mapa → toca num pin → faz pedido

---

## Deploy para produção (Vercel)

```bash
npm run build  # verifica se compila sem erros
```

1. Faz push do repositório para GitHub
2. Liga o repo ao Vercel
3. Em Vercel → Environment Variables, adiciona as 3 variáveis do `.env.local`
4. No Supabase → **Authentication → URL Configuration**, adiciona o teu domínio Vercel a `Redirect URLs`
