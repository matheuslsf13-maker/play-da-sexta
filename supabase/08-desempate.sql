-- ============================================================
--  Play de Todas — como a partida fecha quando empata no fim
--  Rode no SQL Editor do Supabase (depois dos scripts 01 a 07).
--
--  A partida vai ate `target` games. O que acontece no 3x3 e escolha do
--  play, porque cada grupo joga de um jeito:
--
--    nenhum          quem chegar ao alvo primeiro leva (era o unico jeito)
--    vantagem        "vai a 2": segue ate abrir dois games, sem teto
--    vantagem-tie7   vai a 2 ate o alvo x alvo; dali um tie de 7 decide
--    vantagem-tie10  o mesmo, com o super tie de 10
--
--  O tie SEMPRE vai a 2 (7x5 vale, 7x6 nao) -- e regra, nao escolha.
--  `desempate_vai2` fica no banco so por compatibilidade.
-- ============================================================

alter table public.sessions
  add column if not exists desempate text not null default 'nenhum';

alter table public.sessions
  drop constraint if exists sessions_desempate_check;

alter table public.sessions
  add constraint sessions_desempate_check
    check (desempate in ('nenhum', 'vantagem', 'vantagem-tie7', 'vantagem-tie10',
                         'tie7', 'tie7v2', 'tie10', 'tie10v2',
                         'vantagem-tie7v2', 'vantagem-tie10v2'));

alter table public.sessions
  add column if not exists desempate_vai2 boolean not null default true;

comment on column public.sessions.desempate is
  'o que fazer no empate em target-1: nenhum, vantagem, vantagem-tie7 ou vantagem-tie10';
