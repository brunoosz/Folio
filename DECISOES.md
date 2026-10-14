# Decisões técnicas

1. **Tailwind v4 @theme**: tokens definidos via `@theme` em `styles.css` em vez de `tailwind.config`. Mais simples e nativo do v4.

2. **Logo como componente React SVG**: permite animar o splash com CSS puro sem dependência de asset externo. Quando a logo final existir, basta trocar em `brand.config.ts`.

3. **Schema SQL separado do app**: arquivo `db/schema.sql` modela as entidades mas não é aplicado. Mock local usa a mesma interface de repositório para facilitar migração futura.

4. **Mapa muscular 2D com paths SVG simples**: regiões musculares como `<path>` clicáveis. IDs anatômicos estáveis permitem migrar para modelo 3D no futuro.

5. **Comparativos de exercícios como dados estáticos**: tabela `comparativos.ts` com diferenças biomecânicas pré-escritas. Futuramente alimentada por IA com fontes científicas.

6. **Electron para .exe desktop**: adicionado fora da lista original de deps (pedido do usuário). HashRouter no lugar de BrowserRouter para funcionar com file://. Instalador NSIS gerado no CI em runner Windows (ver item 11).

7. **HashRouter**: necessário para Electron (file:// não suporta history API). Funciona igual na web.

8. **`base: './'` no Vite**: caminhos relativos para o mesmo `dist/` funcionar na web, no Electron (`file://`) e no WebView do Capacitor. Manifesto PWA com `start_url`/`scope` relativos. O service worker é registrado manualmente em `main.tsx` e só em origens http(s) da web — nunca no Electron nem no app Android, para não servir cache antigo entre versões.

9. **Capacitor para Android**: empacota o mesmo build web em um APK nativo (Capacitor 8, JDK 21). Escolhido por reaproveitar 100% do código e permitir plugins nativos depois. `CapacitorHttp` ligado para as chamadas à API da Groq não esbarrarem em CORS. Versão do app Android lida do `package.json`.

10. **Groq com chave no cliente (provisório)**: a dona/o dono cola a chave em Configurações e ela fica salva só naquele dispositivo. Ressalva de segurança: uma chave no cliente pode ser lida por quem tiver acesso ao aparelho/DevTools. Com o Supabase, a chamada deve migrar para uma Edge Function com a chave no servidor.

11. **Fluxo de release no CI**: todo push gera `.exe` (windows-latest + electron-builder NSIS) e `.apk` debug (ubuntu-latest + Gradle) como artefatos. Um push de tag `vX.Y.Z` publica os dois no GitHub Releases com instruções em pt-BR. APK debug por enquanto (sem keystore); assinatura de release fica para depois.

12. **Catálogo com sub-regiões musculares**: `musculo` passou a representar sub-regiões (ex.: peito superior/médio/inferior) agrupadas em `grupo_muscular`. O mapa seleciona por sub-região e a troca de exercício pontua alternativas por sub-regiões primárias em comum. IDs estáveis continuam valendo para o 3D.

13. **Boneco animado por cinemática**: cada padrão de movimento define duas poses (ângulos dos segmentos) e o componente interpola com uma âncora fixa (pé, quadril ou mão). Sem vídeo nem biblioteca: leve, offline e no estilo de traço do Folio. O botão "Ver vídeo" abre uma busca no YouTube.

14. **Progressão 12/10/8 (dupla progressão)**: o registro é série a série (`seriesLog`). A sugestão de carga segue: última sessão da mesma série → estimativa por 1RM (Epley) das outras séries → estimativa inicial pelo perfil (peso corporal × razão de referência do exercício × experiência × idade). Tudo exibido como referência, não prescrição.

15. **Dados de saúde com consentimento**: perfil físico, água e sono só entram no contexto da IA com consentimento explícito; retirar o consentimento apaga esses dados. Exportação em JSON omite a chave da IA.

16. **Tema escuro por tokens**: cores fixas viraram tokens semânticos (`tint-*`, `ok`, `warn-ink`, `map-*`) com valores para claro e escuro em `styles.css`. O tema é aplicado antes da primeira pintura por um script em `index.html`.

17. **Rotas secundárias sob demanda**: telas menos usadas são carregadas com `React.lazy`, mantendo o pacote inicial menor (o PWA continua pré-carregando tudo para uso offline).

18. **Prato por refeição sem tabela nutricional**: os itens do plano são classificados por palavras-chave em grupos alimentares (`lib/alimentos.ts`) e desenhados como um círculo de cores claras com ícones. A comparação com o que foi comido é por grupos, não por calorias — leve, offline e sem "contar calorias".

19. **Exames com referência do laudo em primeiro lugar**: o catálogo (`data/exames.ts`) traz faixas gerais para adultos, usadas só quando o laudo não informa a faixa e a unidade é compatível. A leitura do laudo é local (regex sobre o texto ou o PDF via pdf.js, carregado sob demanda); a IA pode organizar laudos bagunçados e gera uma leitura educativa, nunca diagnóstico.

20. **Base de conhecimento = RAG local**: materiais ficam no IndexedDB, divididos em trechos de ~1.000 caracteres; a busca é BM25 simplificada com o mesmo tokenizador da biblioteca. Os trechos mais relevantes entram no prompt com citação. Não há fine-tuning. Com o Supabase, os trechos ganham embeddings (pgvector) e sincronização.

21. **Lembretes por plataforma**: Android usa `@capacitor/local-notifications` (agendamento repetido no sistema, funciona com o app fechado); PC e web usam a API de Notificações com um agendador interno, que pula lembretes já resolvidos (meta de água batida, remédio marcado). No Windows, fechar a janela mantém o Folio na bandeja.

22. **Remédios só como lembrete**: o app registra o que a pessoa já usa (nome, dose como na receita, horários) e marca as doses tomadas. Não sugere, não ajusta e não calcula dose.
