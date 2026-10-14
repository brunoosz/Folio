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
