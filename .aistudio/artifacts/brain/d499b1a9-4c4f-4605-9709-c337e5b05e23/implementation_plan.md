# Modernização Premium da Aba de Progresso (Ficha Técnica / AnimeDetailModal)

Reformulação completa da experiência da aba **Progresso** dentro do modal de detalhes do anime (`AnimeDetailModal.tsx`). O objetivo é eliminar ambiguidades (como o confuso botão "Assistir" em um app sem player de vídeo), tornar a navegação e marcação de temporadas 100% intuitiva, e entregar uma estética moderna, imersiva e de alto padrão no fundo preto profundo (`#000000`).

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões críticas de usabilidade e interface:**
>
> 1. **Remoção definitiva do botão "Assistir":**
>    - O projeto WAnime List é um catálogo/tracker de dados oficiais e não possui streaming ou player de vídeo. O termo "Assistir" induzia os usuários ao erro.
>    - **Novo padrão:** Temporadas inativas terão a ação clara **"Definir como Atual"** (ou toque no próprio card). A temporada em andamento terá o selo dourado em destaque **"Temporada Atual"**.
> 2. **Marcação de Conclusão Clara e Sem Adivinhação:**
>    - O círculo isolado que exigia que o usuário "adivinhasse" onde clicar é substituído por um controle de status explícito:
>      - Se concluída: Selo verde esmeralda com ícone de verificação **"✓ Concluída"** (clicável para alternar/desmarcar).
>      - Se pendente: Botão com texto e ícone nítidos **"Marcar Concluída"**, que com 1 clique preenche o arco e atualiza o progresso.
> 3. **Cards Flutuantes no Preto Profundo:**
>    - Manutenção estrita da identidade visual do app: fundo preto absoluto (`#000000`), sem painéis cinzas ou caixas estilo dashboard retrô.
>    - Cada temporada se torna um card translúcido com borda sutil (`bg-zinc-950/70 border border-white/10 rounded-2xl`), conectado por uma linha vertical luminosa que guia os olhos pela jornada da obra.

---

## 1. Overview & Core Concept

- **O que faz**: Permite ao usuário visualizar a linha do tempo de temporadas/arcos de um anime, saber exatamente em qual temporada ele está, registrar episódios de forma rápida e intuitiva, e avançar para novas temporadas sem dúvidas.
- **Público-alvo**: Usuários que acompanham animes com múltiplas temporadas (ex: *Re:Zero*, *Demon Slayer*, *Attack on Titan*, *One Piece*) e precisam de uma interface limpa para saber onde pararam.
- **Valor Principal**: Elimina qualquer confusão sobre pirataria/player de vídeo, oferecendo uma experiência focada em rastreamento de lista com clareza visual imediata.

---

## 2. User Experience & Visual Design

### O que o usuário verá na aba Progresso:

1. **Barra de Avaliação Pessoal (Topo):**
   - Slider suave de nota com estrelas douradas (`★ 8.5 / 10`), com visual limpo flutuando sobre o preto e opção rápida de limpar nota.
2. **Resumo da Linha do Tempo e Filtros:**
   - Cabeçalho: Ícone de camadas + **"Linha do Tempo"** + contador de progresso da obra (ex.: `3/4 temporadas concluídas`).
   - Abas elegantes de filtro quando houver filmes/OVAs: `Séries (3)` / `Extras (1)` e botão `Gerenciar` para customizações avançadas.
3. **Cards de Temporadas Conectados (Jornada Visual):**
   - **Para Temporadas Já Concluídas:**
     - Card sutil com número da temporada, total de episódios e data/formato (TV/Filme).
     - Selo verde esmeralda: **"✓ Concluída"**.
     - Ação rápida: Botão ou clique para **"Definir como Atual"** caso o usuário decida rever ou tenha marcado por engano.
   - **Para a Temporada Atual (Destaque Principal):**
     - Borda dourada/âmbar com leve brilho ambiente (`border-amber-400/60 shadow-lg shadow-amber-500/10`).
     - Tag luminosa: **"★ Temporada Atual"**.
     - **Painel Central de Episódios:**
       - Botão `-1 Ep` (com proteção contra valores negativos).
       - Contador grande e nítido em numerais tabulares: **Episódio 11 / 19**.
       - Botão `+1 Ep` em destaque dourado/âmbar de fácil toque.
       - Botão sutil `Digitar` para pular direto para um episódio específico.
       - Barra de progresso em gradiente esmeralda/âmbar (`58% concluído · 8 eps restantes`).
     - **Ação Rápida de Conclusão:** Botão verde **"Marcar Temporada Concluída"**.
   - **Para Próximas Temporadas (Ainda Não Iniciadas):**
     - Card com texto esmaecido elegante e status **"Pendente"**.
     - Botão nítido: **"Iniciar Temporada"** ou **"Definir como Atual"**, tornando natural o avanço na obra.
4. **Alerta Inteligente de Avanço de Temporada:**
   - Quando o usuário atinge o último episódio da temporada atual e existe uma próxima cadastrada, surge um card comemorativo no topo da aba:
     - `🎉 Temporada concluída! Deseja avançar para a Temporada 5?` com botão dourado **"Avançar para Próxima"**.

---

## 3. Key Product Decisions & Trade-Offs

- **Substituição Cirúrgica:**
  - Apenas o bloco renderizado por `{activeTab === 'progress'}` dentro de `src/components/AnimeDetailModal.tsx` será aprimorado.
  - **Zero alterações** nas outras abas da Ficha Técnica (`Infos`, `Elenco`, `Músicas`, `Onde Ver`), no banner superior, na tela de lista ou nas funções de banco de dados do Firestore.
- **Preservação de Todas as Lógicas de Negócio:**
  - `onSwitchSeason`, `onToggleSeasonWatched`, `onIncrement`, `onDecrement`, `onUpdateEpisode`, `onUpdateRating` permanecem chamados exatamente com as mesmas assinaturas e regras de validação (limites de episódios, datas e sincronização com o banco).

---

## 4. Technical Architecture & Component Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                    AnimeDetailModal.tsx                         │
│                                                                 │
│  [ Banner + Capa + Título + Status Pills ]                      │
│  [ Abas: Progresso (Ativa) | Infos | Elenco | Músicas | Onde Ver]│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │               CONTEÚDO DA ABA DE PROGRESSO                │  │
│  │                                                           │  │
│  │  1. Avaliação Pessoal (Slider ★ 1-10)                     │  │
│  │  2. Linha do Tempo (Resumo + Filtro Séries/Extras)        │  │
│  │                                                           │  │
│  │  [Card: Temporada 1]  -> Status: [✓ Concluída]            │  │
│  │                          Ação:   [Definir como Atual]     │  │
│  │                                                           │  │
│  │  [Card: Temporada 2 (ATUAL) - Destaque Âmbar]             │  │
│  │    • Status: [★ Temporada Atual]                          │  │
│  │    • Controles: [-1]  Ep 11 / 19  [+1]  [Digitar]         │  │
│  │    • Barra: [=========>      ] 58% (8 restantes)          │  │
│  │    • Botão: [Marcar Temporada Concluída]                  │  │
│  │                                                           │  │
│  │  [Card: Temporada 3]  -> Status: [Pendente]               │  │
│  │                          Ação:   [Iniciar Temporada]      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```
