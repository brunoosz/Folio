# Folio — Caderno inteligente de saúde e treino

## Marca
- Nome: Folio | Slogan: Corpo, rotina e ciência
- Config centralizada: `src/brand/brand.config.ts`
- Logo SVG: `src/brand/logo.tsx` (componentes LogoMark e Wordmark)
- Cor da marca: `--color-brand: #0075de`

## Tokens visuais (CSS vars + Tailwind @theme em `src/styles.css`)
- canvas #f6f5f4 | surface #ffffff | ink #111111 | ink-body #615d59
- brand #0075de | brand-ghost #e6f3fe
- muscle #f64932 | muscle-secondary #62aef0
- routine #ffb110 | science #097fe8
- Raios: card 12px, btn 8px, pill 9999px
- Fontes: Inter (UI), Source Serif 4 (citações científicas)

## Regras de design
- Fundo SEMPRE #f6f5f4, cartões brancos com borda 1px rgba(0,0,0,0.08)
- SEM sombras, SEM gradientes. Variedade por cartões com fundo de acento.
- Um único botão azul preenchido por tela. Secundários: ghost ou texto.
- Toque mínimo 44px. Texto mínimo no treino: 14px. Contraste AA.
- Transições 200ms ease. Mola/bounce só em personagens.
- Ilustrações "desenhadinhas" em traço de UMA cor. `prefers-reduced-motion`.

## Stack
React + Vite + TS + Tailwind v4 | Zustand | React Router | @dnd-kit | PWA
Dados mock via interface de repositório (trocar por Supabase depois).

## Convenções
- Interface 100% pt-BR. Nomes de arquivo/variáveis em inglês.
- Componentes base em `src/components/ui/`.
- Páginas em `src/pages/`. Ilustrações em `src/components/illustrations/`.
- Schema SQL em `db/schema.sql` (modelo, não aplicado).
- Nunca diagnosticar, prescrever ou incentivar prática lesiva.
- Dados de exercícios marcados "a revisar por profissional".

## Economia de crédito
- Trabalhar por fases. Resumo curto ao final. Parar e esperar "continuar".
- Sem bibliotecas extras. Edições pontuais. Sem impressão de arquivos inteiros.
