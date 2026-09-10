-- ============================================================
--  Play de Todas — como cada jogadora paga
--  Rode no SQL Editor do Supabase (depois dos scripts 01 a 08).
--
--  Sao quatro categorias, e a regra de cada uma mora em
--  `src/lib/mensalidade.ts`:
--
--    mensalista  paga por mes. Fica liberada enquanto `pago_mes` for o mes
--                de hoje, entao na VIRADA DO MES ela volta a aparecer
--                devendo SOZINHA -- nao existe rotina para rodar, esquecer
--                de rodar ou rodar duas vezes.
--    avulsa      paga por play. `pago_avulso` e um credito de UMA
--                participacao, gasto quando aquele play e finalizado.
--    convidada   nao paga. Dois plays seguidos so acendem um alerta; nao
--                travam nada, porque quem decide isso e a organizacao.
--    isenta      nao paga e nunca alerta -- para quem tem acordo permanente.
--                E se o grupo NAO COBRA nada, e so deixar todo mundo isenta
--                que o portao some.
-- ============================================================

alter table public.players
  add column if not exists categoria text not null default 'isenta';

alter table public.players
  drop constraint if exists players_categoria_check;

alter table public.players
  add constraint players_categoria_check
    check (categoria in ('mensalista', 'avulsa', 'convidada', 'isenta'));

-- Mensalista: ate que mes esta paga, no formato AAAA-MM.
alter table public.players
  add column if not exists pago_mes text;

-- Avulsa: credito de uma participacao.
alter table public.players
  add column if not exists pago_avulso boolean not null default false;

comment on column public.players.categoria is
  'como a jogadora paga: mensalista, avulsa, convidada ou isenta (nao cobra)';
comment on column public.players.pago_mes is
  'mensalista: ate que mes esta paga (AAAA-MM). Comparado com o mes de hoje';
comment on column public.players.pago_avulso is
  'avulsa: credito de UMA participacao, gasto ao finalizar o play';
