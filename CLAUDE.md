# Play de Todas — guia rápido do projeto

App do campeonato de **beach tennis** feminino da **V3 Arena**, jogado toda
**segunda às 20h**. Monta duplas equilibradas, lança placares, fecha o dia e o
mês, e mostra rankings e estatísticas. Tudo é operado principalmente **pelo
celular**.

**Antes de mudar regra do campeonato, algoritmo de duplas ou o "quem está em
quadra", leia [`DECISOES.md`](DECISOES.md)** — ele guarda o que já foi medido e
descartado, para não refazer discussão encerrada.

## Stack

React 18 + TypeScript + Vite 5. Sem router (o estado das abas fica no `App.tsx`).
PWA (manifest + service worker). Português do Brasil em toda a interface.

## Comandos

```bash
npm run dev      # servidor local em http://localhost:5173
npm run build    # tsc -b + vite build (use antes de commitar)
npx tsc --noEmit # só a checagem de tipos
```

## Mapa do código

```
src/pages/       telas: Play.tsx (a maior), Ranking.tsx, Stats.tsx, Players.tsx
src/lib/         regras: pairing (fila de partidas e grupos), scoring,
                 streaks (status 🔥), stats, poster (imagens de fechamento),
                 roster (importar lista), emQuadra (horários locais), store
src/data/        armazenamento: localRepo (navegador) e supabaseRepo, com fila
                 de escrita otimista que sobrevive a refresh (queue.ts)
src/config.ts    URL e chave pública do Supabase (NUNCA a secret/service_role)
supabase/*.sql   migrações, rodadas na ordem numérica no SQL Editor
```

⚠️ Duas colunas do banco têm nome enganoso, mantido para não migrar dados:
`matches.round` é a **posição na fila** (não existe mais rodada) e
`sessions.rounds` é o **total de partidas do dia**.

`hasSupabase` decide qual driver é usado. Escrita exige login; leitura é pública.

## Regras do campeonato (não invente, elas são específicas)

- Partida até 4 pontos, sem empate. Pontos = games do vencedor − do perdedor
  (mínimo 1). Quem perde não pontua.
- **Não há rodadas.** O play é uma **fila de partidas**; cada quadra que vaga
  puxa da fila a partida cujas quatro meninas estão livres, dando preferência a
  quem está fora há mais tempo (`proximasDasQuadras`).
- Rodízio completo: cada uma faz dupla com cada uma das outras exatamente uma
  vez. **Todas jogam o mesmo número de partidas.** Quando a conta não fecha
  (grupos de 6, 7, 10, 11), algumas duplas repetem — escolhidas para que cada
  jogadora repita a mesma quantidade (`repeticoesPorJogadora`). **Quem enfrenta quem também é escolhido**, sempre pela dupla que menos
  se enfrentou até ali — o alvo é espalhar, não zerar (é impossível zerar).
- **Dois formatos**, escolhidos ao criar o play: `todas` (rodízio único) e
  `grupos` (o mesmo rodízio dentro de grupos formados por nível, grupo 1 com as
  mais bem pontuadas). Nos grupos os pontos continuam **individuais** e o
  ranking do dia é **um só** — mas o **pódio é um por grupo**. No fim do play a
  organizadora escolhe se gera o texto e a arte de **todos os grupos ou de um
  só** (chips "Tudo / Grupo 1 / Grupo 2…" no modal do ranking do dia), e os dois
  saem carimbados com o grupo. O status de **cada** medalhista aparece no texto
  e na imagem.
- **Status 🔥**: mantido terminando o play no **pódio do dia** (top 3; nos
  grupos, o top 3 **de cada grupo**, nunca mais que metade do grupo —
  `vagasDoPodio`). Faltar zera o status, mesmo com vida. Escada em
  `src/lib/streaks.ts`, de
  🔥 *Em chamas* (2) até 👑💎🌟 **Duquesa da V3** (8+). No fim do mês a jogadora
  escolhe **usar** (vira pontos, zera) ou **preservar** (segue e ganha 1 vida).
- **O mês fecha na mão**, no botão "🏁 Finalizar o mês" do Ranking (dá para
  reabrir). A premiação acontece no último play do mês, antes de o calendário
  virar.
- **A força é visível** (`src/lib/forca.ts`, aba “💪 Força” em Stats, na ficha da
  jogadora e na linha dela em Meninas). É o mesmo Elo que sempre montou os
  grupos e as duplas — só que agora com um número e um nível na tela. A escala
  mostrada é a clássica, **1500 no meio**, e isso importa: o Elo é **soma zero**,
  então a média do grupo não se move e as faixas continuam querendo dizer a mesma
  coisa no ano que vem. As faixas (±25 / ±75) saem de uma temporada simulada de
  12 sextas com 16 jogadoras, que espalhou o grupo de −107 a +91. Abaixo de
  `JOGOS_PARA_FIRMAR` a nota sai marcada como **provisória**, e quem nunca jogou
  fica fora da lista.
- **A dupla tem força própria** (`forcaDeDuplas`, aba “🤝 Dupla”). Não é a média
  das duas — essa é só o **ponto de partida**. A partir dela, cada partida
  **daquela dupla** move a nota pela fórmula do Elo, então `nota − base` é o
  **entrosamento**: duas medianas que se acham em quadra rendem mais do que a
  soma das notas diz, e isso não aparece na nota individual de ninguém.
- **O entrosamento entra no balanceamento** (`ajusteDeEntrosamento` →
  `ScheduleOptions.entrosamento` → `forcaDuo`). Escolher quem enfrenta quem
  usando só a média individual ignorava que certas duplas rendem acima disso. Só
  entram duplas com `JOGOS_PARA_ENTROSAMENTO`+ jogos juntas: com duas ou três
  partidas o número é ruído, e ruído no confronto piora o equilíbrio.
- **O ranking zera todo mês, o histórico não.** A força que equilibra as duplas e
  divide os grupos sai de `ratings()`, que é um **Elo**: cada partida move a nota
  conforme quem estava do outro lado, então **vencer quem está melhor rende muito
  mais** do que vencer quem está pior. Não é o ranking do mês (senão o primeiro
  play do mês sairia desequilibrado) e não é média de pontos, que não sabe de quem
  você ganhou — e por isso quebrava no modo em grupos.
- **O empate no fim é configurável** (`sessions.desempate`, `src/lib/desempate.ts`).
  São **três modos**, e o que muda é o que acontece no `alvo-1`x`alvo-1` (o 3x3):
  `alvo` (quem chegar primeiro leva), `vantagem` (“só vai a 2”, sem teto) e
  `vantagem-tie7`/`vantagem-tie10` (vai a 2 até o `alvo`x`alvo`, e dali um tie
  decide — o **único modo com teto**). **O tie sempre vai a 2** (7x5 vale, 7x6
  não): é regra, não pergunta. **Só a vantagem muda o que dá para lançar**, porque
  é a única em que a vencedora passa do alvo; com tie o placar em games não muda.
- **Colar a lista do grupo** (`ImportarLista`) serve **duas** telas, pelo `modo`:
  em `play` marca presença; em `cadastro` (aba Meninas) só cria quem falta. E os
  **ícones da lista do WhatsApp são descartados** (`ICONES`, em `roster.ts`) — saem
  **antes** da numeração, senão um “✅ 3 - Bia” esconde o “3 -”.
- **Play avulso** (`sessions.ranked = false`): conta no histórico e na força,
  mas **não soma no ranking do mês nem mexe nas sequências**. Serve para o jogo
  fora de calendário que não é o campeonato.
- **Partida iniciada**: quem está em quadra agora é definido pelo botão
  "▶️ Partida iniciada"; lançar o placar encerra. Isso alimenta o aviso de
  quadra parada e a troca de jogadoras.
- A lista "Próximas na fila" usa `ordemPrevista()`, não a ordem gravada: mostrar
  a ordem de geração colocava na frente quem tinha acabado de sair da quadra.
- **O placar só é lançável depois de "▶️ Partida iniciada"** (botões de "venceu"
  desabilitados). Corrigir placar é o ✏️ da lista "Já jogadas", que abre um modal
  e **preserva o `ended_at`** — não devolve a partida para a fila.

## A tela é um celular na beira da quadra

- **A ordem de criar o play** é quem joga → **formato** → detalhes. O formato é a
  escolha que muda tudo o que vem depois, então tem cartão próprio logo abaixo das
  participantes, como **lista vertical** (nomes longos num `segmented` quebram no
  meio das palavras a 375px).
- `.field > span` vale para `label` **e** `div`. Enquanto só `label.field > span`
  tinha estilo, metade do formulário saia com rótulo pequeno em caixa alta e a
  outra metade com texto corrido do corpo.
- **Nome de pessoa não quebra no meio**: o `span` de cada jogadora é `nowrap` e
  carrega o `+` da frente, então a linha só parte entre os dois nomes da dupla.
- **Separador entre links é desenhado (`::before`), não digitado**: como texto, o
  `·` conta como palavra e vai parar sozinho no fim da linha.
- **Nada de `(s)`**: use `plural()` de `src/lib/types.ts`.

## Convenções

- Comentários e nomes em português, sem acento em identificadores.
- Código sem dependências novas sempre que der; o bundle é servido para
  celulares em quadra.
- Rodar `npm run build` antes de commitar; o push na `main` publica o site.
