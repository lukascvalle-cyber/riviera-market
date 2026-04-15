-- ============================================================
-- Tabela de candidaturas de vendedores
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vendor_applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Quem se candidatou (pode ser null se o e-mail ainda não foi confirmado)
  applicant_profile_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Dados pessoais
  full_name             TEXT NOT NULL,
  email                 TEXT NOT NULL,
  cpf                   TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  profile_photo_url     TEXT,
  -- Dados do negócio
  vendor_type           TEXT NOT NULL CHECK (vendor_type IN ('ambulante', 'barraca_fixa')),
  modules               INTEGER[] NOT NULL,
  products_description  TEXT NOT NULL,
  -- Documentos
  authorization_doc_url TEXT,
  identity_doc_url      TEXT,
  -- Análise
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason      TEXT,
  reviewed_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER vendor_applications_updated_at
  BEFORE UPDATE ON public.vendor_applications
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RLS
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode submeter uma candidatura (formulário público)
CREATE POLICY "Public submit vendor applications"
  ON public.vendor_applications FOR INSERT WITH CHECK (true);

-- Candidato pode ver a própria candidatura
CREATE POLICY "Applicant reads own application"
  ON public.vendor_applications FOR SELECT
  USING (applicant_profile_id = auth.uid());

-- Admins lêem e atualizam todas
CREATE POLICY "Admins read vendor applications"
  ON public.vendor_applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'administrador'
  ));

CREATE POLICY "Admins update vendor applications"
  ON public.vendor_applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'administrador'
  ));

-- ============================================================
-- Bucket de documentos de vendedores
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-docs',
  'vendor-docs',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Qualquer pessoa pode fazer upload (formulário público, antes do login)
CREATE POLICY "Public upload vendor docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vendor-docs');

-- Leitura pública (URLs são hard-to-guess, admins precisam ver os docs)
CREATE POLICY "Public read vendor docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vendor-docs');

-- ============================================================
-- Atualiza trigger de criação de utilizador:
-- cria vendor row automaticamente quando role = 'vendedor'
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'frequentador'::public.user_role
  );

  INSERT INTO public.profiles (id, full_name, role, module_id, building_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_role,
    CASE
      WHEN NEW.raw_user_meta_data->>'module_id' ~ '^[0-9]+$'
      THEN (NEW.raw_user_meta_data->>'module_id')::INTEGER
      ELSE NULL
    END,
    CASE
      WHEN NEW.raw_user_meta_data->>'building_id' ~ '^[0-9]+$'
      THEN (NEW.raw_user_meta_data->>'building_id')::INTEGER
      ELSE NULL
    END
  );

  -- Para vendedores: cria o row de vendor automaticamente (is_approved = false)
  IF v_role = 'vendedor' THEN
    INSERT INTO public.vendors (profile_id, display_name, category, is_active, is_approved)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'outros'::public.vendor_category,
      false,
      false
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;
