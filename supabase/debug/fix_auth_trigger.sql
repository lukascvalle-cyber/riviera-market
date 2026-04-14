-- FIX: Recria o trigger com search_path explícito e tratamento de erros
-- O problema mais comum é o security definer não encontrar o schema public

-- 1. Remove trigger e função existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Recria a função com search_path = public (essencial para security definer)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  -- Tenta obter o role dos metadados, usa 'frequentador' como fallback
  BEGIN
    v_role := (new.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'frequentador'::user_role;
  END;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    new.id,
    v_role,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );

  RETURN new;
END;
$$;

-- 3. Religa o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Garante que o Supabase tem permissão para executar a função
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- 5. Confirma
SELECT 'Trigger recriado com sucesso' AS status;
