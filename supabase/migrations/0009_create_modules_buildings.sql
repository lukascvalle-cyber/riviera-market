-- ============================================================
-- Módulos e Edifícios da Riviera de São Lourenço, SP
-- ============================================================

-- Tabela de módulos (módulos de praia 1-8)
CREATE TABLE IF NOT EXISTS public.modules (
  id   SERIAL PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  name   TEXT    NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de edifícios (condomínios por módulo)
CREATE TABLE IF NOT EXISTS public.buildings (
  id        SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  name      TEXT    NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS buildings_module_id_idx ON public.buildings(module_id);

-- RLS: leitura pública (são dados de referência)
ALTER TABLE public.modules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modules_public_read"   ON public.modules   FOR SELECT USING (true);
CREATE POLICY "buildings_public_read" ON public.buildings FOR SELECT USING (true);

-- ============================================================
-- Adicionar módulo e edifício ao perfil do utilizador
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS module_id   INTEGER REFERENCES public.modules(id)   ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS building_id INTEGER REFERENCES public.buildings(id) ON DELETE SET NULL;

-- Utilizadores podem atualizar os próprios campos de localização
-- (a política "profiles_update_own" já cobre toda a linha — sem alteração necessária)

-- ============================================================
-- Dados: Módulos 1 a 8
-- ============================================================

INSERT INTO public.modules (number, name) VALUES
  (1, 'Módulo 1'),
  (2, 'Módulo 2'),
  (3, 'Módulo 3'),
  (4, 'Módulo 4'),
  (5, 'Módulo 5'),
  (6, 'Módulo 6'),
  (7, 'Módulo 7'),
  (8, 'Módulo 8')
ON CONFLICT (number) DO NOTHING;

-- ============================================================
-- Dados: Edifícios do Módulo 1
-- ============================================================

INSERT INTO public.buildings (module_id, name)
SELECT m.id, b.name
FROM public.modules m
CROSS JOIN (VALUES
  ('Caravelas'),
  ('San Remo'),
  ('Itapuã'),
  ('Maranello'),
  ('Ilha da Madeira'),
  ('Ocean Park Pacific'),
  ('Gaivota Flat'),
  ('Aldea Bianca'),
  ('Flamingo Flat'),
  ('Atobá'),
  ('Nice'),
  ('Sun Line'),
  ('San Marino'),
  ('Copacabana'),
  ('Ipanema'),
  ('Ilha Verde'),
  ('Viva Vida'),
  ('Fortes'),
  ('All Time Family Club')
) AS b(name)
WHERE m.number = 1;

-- ============================================================
-- Atualizar o trigger de auth para salvar module_id e building_id
-- (vindos do user_metadata passado no signUp)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, module_id, building_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'frequentador'::public.user_role
    ),
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
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;
