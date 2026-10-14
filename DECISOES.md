# Decisões técnicas

1. **Tailwind v4 @theme**: tokens definidos via `@theme` em `styles.css` em vez de `tailwind.config`. Mais simples e nativo do v4.

2. **Logo como componente React SVG**: permite animar o splash com CSS puro sem dependência de asset externo. Quando a logo final existir, basta trocar em `brand.config.ts`.

3. **Schema SQL separado do app**: arquivo `db/schema.sql` modela as entidades mas não é aplicado. Mock local usa a mesma interface de repositório para facilitar migração futura.

4. **Mapa muscular 2D com paths SVG simples**: regiões musculares como `<path>` clicáveis. IDs anatômicos estáveis permitem migrar para modelo 3D no futuro.

5. **Comparativos de exercícios como dados estáticos**: tabela `comparativos.ts` com diferenças biomecânicas pré-escritas. Futuramente alimentada por IA com fontes científicas.

6. **Electron para .exe desktop**: adicionado fora da lista original de deps (pedido do usuário). HashRouter no lugar de BrowserRouter para funcionar com file://. Build portátil (sem instalador NSIS, que requer Wine no Linux).

7. **HashRouter**: necessário para Electron (file:// não suporta history API). Funciona igual na web.
