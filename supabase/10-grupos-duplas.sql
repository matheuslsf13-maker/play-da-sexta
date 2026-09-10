-- ============================================================
--  Play de Todas — formato "grupos + duplas"
--  Rode no SQL Editor do Supabase (depois dos scripts 01 a 09).
--
--  Fase 1: grupos EQUILIBRADOS entre si (mesma força média), todas com
--  todas dentro do grupo.
--  Fase 2: dupla FIXA por colocação — 1ª com 1ª de outro grupo, 2ª com 2ª,
--  e assim por diante. As duplas viram chaves e jogam só dentro da chave.
--  O pódio do dia sai apenas da fase 2.
-- ============================================================

alter table public.sessions
  drop constraint if exists sessions_format_check;

alter table public.sessions
  add constraint sessions_format_check
    check (format in ('todas', 'grupos', 'grupos-duplas'));

-- As duplas fixas da fase 2, na ordem de força. Nulo enquanto a fase 1 roda.
alter table public.sessions
  add column if not exists duos jsonb;

-- Quantas duplas entram no mata-mata. Padrão 8 (= 16 jogadoras, quartas).
-- Sobrando gente, as piores colocadas da fase de grupos ficam de fora;
-- faltando, todas entram e as melhores passam de bye.
alter table public.sessions
  add column if not exists duplas_mm int;

-- Games que fecham a partida em CADA fase: [grupos, duplas, semi, final].
-- Nulo = usa o `target` do play inteiro, como nos outros formatos.
alter table public.sessions
  add column if not exists alvos jsonb;

-- O desempate de cada fase, na mesma ordem. Nulo = usa `desempate` em todas.
alter table public.sessions
  add column if not exists desempates jsonb;

-- 1 = grupos, 2 = duplas fixas, 3 = semifinal, 4 = final.
alter table public.matches
  add column if not exists fase int not null default 1;

comment on column public.sessions.duos is
  'grupos-duplas: as duplas fixas da fase 2, na ordem de forca';
comment on column public.sessions.duplas_mm is
  'grupos-duplas: quantas duplas entram no mata-mata (padrao 8 = 16 jogadoras)';
comment on column public.sessions.alvos is
  'grupos-duplas: games que fecham a partida em cada fase [grupos, duplas, semi, final]';
comment on column public.matches.fase is
  '1 = grupos, 2 = duplas fixas, 3 = semifinal, 4 = final';
