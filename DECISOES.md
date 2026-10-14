# Decisões técnicas

1. **Tailwind v4 @theme**: tokens definidos via `@theme` em `styles.css` em vez de `tailwind.config`. Mais simples e nativo do v4.

2. **Logo como componente React SVG**: permite animar o splash com CSS puro sem dependência de asset externo. Quando a logo final existir, basta trocar em `brand.config.ts`.

3. **Schema SQL separado do app**: arquivo `db/schema.sql` modela as entidades mas não é aplicado. Mock local usa a mesma interface de repositório para facilitar migração futura.
