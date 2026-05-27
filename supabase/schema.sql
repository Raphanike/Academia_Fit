-- ═══════════════════════════════════════════════════════════════
-- FitCoach — Schema do Banco de Dados (Supabase / PostgreSQL)
-- Execute este SQL no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════

-- ── 1. PROFILES ─────────────────────────────────────────────────
-- Estende o auth.users do Supabase com dados extras (nome, role)
CREATE TABLE IF NOT EXISTS public.profiles (
  id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome  TEXT NOT NULL,
  role  TEXT NOT NULL CHECK (role IN ('personal', 'aluno')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: cria o profile automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'aluno')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. ALUNOS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alunos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL,
  telefone   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ── 3. TREINOS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.treinos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id   UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  descricao  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ── 4. EXERCÍCIOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercicios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_id   UUID REFERENCES public.treinos(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  series      INTEGER NOT NULL DEFAULT 3,
  repeticoes  TEXT NOT NULL DEFAULT '10',
  observacoes TEXT,
  video_url   TEXT,
  ordem       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ── 5. TREINO REALIZADO ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.treino_realizado (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_id    UUID REFERENCES public.treinos(id) ON DELETE CASCADE,
  aluno_id     UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  realizado_em TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — Proteção de dados por usuário
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treino_realizado ENABLE ROW LEVEL SECURITY;


-- ── Policies: PROFILES ──────────────────────────────────────────

-- Qualquer usuário autenticado vê seu próprio perfil
CREATE POLICY "profiles: leitura própria"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Personal pode ver perfis de alunos
CREATE POLICY "profiles: personal vê todos"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  );

-- Permite inserir o próprio perfil (trigger)
CREATE POLICY "profiles: inserção própria"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Permite atualizar o próprio perfil
CREATE POLICY "profiles: atualização própria"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- ── Policies: ALUNOS ────────────────────────────────────────────

-- Personal pode ver e gerenciar todos os alunos
CREATE POLICY "alunos: personal gerencia"
  ON public.alunos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'personal'
    )
  );

-- Aluno vê apenas os próprios dados
CREATE POLICY "alunos: aluno vê próprio"
  ON public.alunos FOR SELECT
  USING (user_id = auth.uid());


-- ── Policies: TREINOS ───────────────────────────────────────────

-- Personal pode gerenciar todos os treinos
CREATE POLICY "treinos: personal gerencia"
  ON public.treinos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'personal'
    )
  );

-- Aluno vê apenas seus treinos
CREATE POLICY "treinos: aluno vê próprios"
  ON public.treinos FOR SELECT
  USING (
    aluno_id IN (
      SELECT id FROM public.alunos WHERE user_id = auth.uid()
    )
  );


-- ── Policies: EXERCÍCIOS ────────────────────────────────────────

-- Personal pode gerenciar exercícios
CREATE POLICY "exercicios: personal gerencia"
  ON public.exercicios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'personal'
    )
  );

-- Aluno pode ver exercícios dos seus treinos
CREATE POLICY "exercicios: aluno vê próprios"
  ON public.exercicios FOR SELECT
  USING (
    treino_id IN (
      SELECT t.id FROM public.treinos t
      JOIN public.alunos a ON a.id = t.aluno_id
      WHERE a.user_id = auth.uid()
    )
  );


-- ── Policies: TREINO REALIZADO ──────────────────────────────────

-- Personal vê todos os treinos realizados
CREATE POLICY "treino_realizado: personal vê todos"
  ON public.treino_realizado FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'personal'
    )
  );

-- Aluno insere e vê seus próprios registros
CREATE POLICY "treino_realizado: aluno gerencia próprio"
  ON public.treino_realizado FOR ALL
  USING (
    aluno_id IN (
      SELECT id FROM public.alunos WHERE user_id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════════
-- REALTIME — Habilita atualizações em tempo real
-- ═══════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.treino_realizado;
ALTER PUBLICATION supabase_realtime ADD TABLE public.treinos;


-- ═══════════════════════════════════════════════════════════════
-- STORAGE — Bucket para vídeos dos exercícios
-- (Execute via Dashboard > Storage > New bucket, ou use a API)
-- ═══════════════════════════════════════════════════════════════
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('exercicios', 'exercicios', true);


-- ═══════════════════════════════════════════════════════════════
-- DADOS INICIAIS — Personal trainer
-- Substitua o email e rode DEPOIS de criar o usuário no Auth
-- ═══════════════════════════════════════════════════════════════
-- UPDATE public.profiles
-- SET role = 'personal', nome = 'Sua Personal'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'personal@seudominio.com');
