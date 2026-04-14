-- Cola e executa este bloco no SQL Editor do Supabase para ver o estado atual

-- 1. Verifica se o trigger existe
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Verifica se a função existe e o seu código
SELECT prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Verifica se o enum user_role existe
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'user_role';

-- 4. Simula o que o trigger faria (substitui o email pelo que usaste)
-- Se isto der erro, mostra a causa real:
DO $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    gen_random_uuid(),
    'frequentador'::user_role,
    'Teste'
  );
  -- Limpa o teste
  DELETE FROM public.profiles WHERE full_name = 'Teste';
  RAISE NOTICE 'OK — insert na profiles funciona';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERRO: %', SQLERRM;
END;
$$;
