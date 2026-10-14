<p align="center">
  <img src="public/logo-mark.svg" width="96" height="96" alt="Logo do Folio" />
</p>

<h1 align="center">Folio</h1>

<p align="center"><strong>Corpo, rotina e ciência.</strong><br />
Caderno inteligente de saúde e treino — para web, Windows e Android.</p>

<p align="center">
  <a href="https://github.com/brunoosz/Folio/releases/latest">Baixar a versão mais recente</a>
</p>

---

## O que é o Folio

O Folio é um caderno digital para organizar treinos, hábitos e aprendizado sobre o próprio corpo. Ele junta, num só lugar, a ficha de treino, a rotina do dia, o histórico de evolução e uma biblioteca de referências científicas — com um assistente de IA que explica conceitos e sempre aponta as fontes.

O Folio **não diagnostica, não prescreve e não substitui profissionais**. Ele ajuda a registrar, entender e conversar melhor com quem acompanha você.

## Funcionalidades

- **Pesquisa inicial** — ao entrar pela primeira vez, uma breve pesquisa (altura, peso, sexo, idade, experiência, objetivo, lesões e local de treino) forma a base de conhecimento do usuário. Tudo pode ser pulado e editado depois em *Perfil → Meus dados*, com consentimento explícito para dados de saúde (LGPD).
- **Treino** — lista compacta com nome, séries, repetições e carga. Toque em um exercício para abrir a ficha completa: **boneco animado** executando o movimento (em pé, sentado, deitado…), link para **vídeo**, passo a passo, músculos, exigência articular e cuidados. Reordene arrastando e escolha entre **"Apenas hoje"** e **"Salvar como padrão"**.
- **Progressão de carga 12 / 10 / 8** — anote carga, repetições e esforço (leve, no limite, falha) de cada série. Quando a série de 12 fica leve, o Folio sugere subir a carga; a primeira sugestão usa o seu perfil. Gráfico de evolução com **projeção** pela idade e experiência, recordes e 1RM estimado. Cronômetro de descanso entre séries.
- **Fichas** — crie e edite fichas, use **modelos prontos** (corpo inteiro, AB, ABC) ou peça uma **sugestão à IA** com base no seu perfil.
- **Troca de exercício** — mostra as diferenças biomecânicas, avisa quando a troca **não é equivalente**, filtra por equipamento e por **proteção articular** (pré-selecionada pelas lesões do perfil) e traz uma sugestão **consultiva** da IA.
- **Mapa muscular** — boneco musculoso 2D (frente e costas) com **sub-regiões**: peito superior, médio e inferior, porções do deltoide, cabeças do bíceps e do tríceps, glúteos, quadríceps e mais. Cerca de 70 exercícios no catálogo, filtráveis por parte do músculo e equipamento.
- **Rotina** — **água** pela sua garrafa (ml, com garrafa padrão e "só hoje"), **sono** com horário de dormir e acordar, despertares e qualidade (o app avisa no dia seguinte se a noite foi curta), hábitos e **minha rotina** com horários e tarefas, que aparece na tela inicial e dá contexto à IA.
- **Nutrição** — cadastre o plano da sua nutricionista (cole o texto e o app organiza), converse com a IA para montar uma rotina alimentar ou trocar alimentos pelo que você tem em casa, e use a tabela de **trocas** que funciona offline.
- **Histórico** — sessões anteriores, volume e evolução por exercício.
- **Assistente IA (Groq)** — respostas em pt-BR com **citações** da biblioteca científica e contexto do seu perfil e rotina, configurável pela dona/pelo dono do app.
- **Biblioteca científica** — referências organizadas por tema, com resumos e links para as fontes.
- **Painel admin** — editor do catálogo (criar e editar exercícios, músculos, exigência articular, marcar como revisado), status da IA e configurações, só para a conta proprietária.
- **Home personalizável** — escolha e reorganize os cartões da tela inicial.
- **Tema claro e escuro** — ou seguindo o sistema.
- **Privacidade** — exporte seus dados em JSON, retire o consentimento de dados de saúde ou apague tudo, a qualquer momento.
- **Animações** — abertura animada, transições suaves entre telas e microinterações; tudo respeita a preferência do sistema por **movimento reduzido**.
- **PWA / offline** — na web, pode ser instalado como app e continua abrindo sem internet. Fontes embutidas: o visual se mantém offline também no .exe e no .apk.

> Os dados de exercícios estão marcados como **"a revisar por profissional"**.

## Download

Baixe na página de [**Releases**](https://github.com/brunoosz/Folio/releases/latest):

| Plataforma | Arquivo | Como instalar |
|---|---|---|
| Windows 10/11 | `Folio-Setup-X.Y.Z.exe` | Abra o instalador. Se aparecer o aviso do SmartScreen, clique em **Mais informações → Executar assim mesmo** (o instalador ainda não tem assinatura digital). |
| Android 7+ | `Folio-X.Y.Z.apk` | Baixe no celular e abra. Permita **instalar apps de fontes desconhecidas** para o navegador/gerenciador de arquivos quando o Android pedir. Se o Play Protect avisar, toque em **Instalar mesmo assim**. |

## Primeiro acesso

| Usuário | Senha | Perfil |
|---|---|---|
| `admin` | `admin` | Dona/dono do app (acesso ao painel admin e às configurações da IA) |

Nesta versão, os dados ficam salvos **apenas no dispositivo** (armazenamento local). Trocar de aparelho ou limpar os dados do app apaga o conteúdo.

## Configurando a IA (Groq)

1. Crie uma conta e gere uma chave em [console.groq.com](https://console.groq.com/keys).
2. No Folio, entre como `admin` e abra **Configurações**.
3. Cole a chave no campo da Groq e toque em **Salvar**.

A chave fica guardada somente naquele dispositivo.

> **Segurança:** por ser armazenada no próprio app, a chave pode ser lida por quem tiver acesso ao aparelho. Use uma chave exclusiva para o Folio. Na integração com Supabase, a chamada à Groq passará para o servidor.

## Tecnologias

| Camada | Ferramentas |
|---|---|
| Interface | React 19, TypeScript, Tailwind CSS v4 (tokens via `@theme`) |
| Estado e rotas | Zustand, React Router (HashRouter) |
| Interações | @dnd-kit (arrastar e soltar) |
| Build | Vite, vite-plugin-pwa (service worker e manifesto) |
| Desktop | Electron + electron-builder (instalador NSIS) |
| Android | Capacitor 8 (WebView nativo, `CapacitorHttp`) |
| IA | API da Groq (compatível com OpenAI) |
| Dados | Mock em `localStorage` atrás de uma interface de repositório (Supabase em breve) |

## Estrutura do projeto

```
src/
  brand/              configuração da marca e logo (LogoMark, Wordmark)
  components/
    ui/               componentes base (Button, Card, Sheet, Toast, ...)
    illustrations/    ilustrações em traço de uma cor
    Splash/           animação de abertura
  pages/              telas (Home, Treino, Troca, Mapa, Rotina, Histórico,
                      Assistente, Biblioteca, Admin, Configurações, Perfil, Login)
  hooks/              stores Zustand (auth, treino, rotina, histórico, home, configurações)
  lib/                cliente da API da Groq e busca de referências
  data/               tipos, seed, repositório mock, conteúdo científico
  styles.css          tokens visuais e animações
public/               ícones, favicon e logo (PWA)
build/                ícone do instalador Windows
electron/main.cjs     processo principal do app desktop
android/              projeto nativo Android (Capacitor)
capacitor.config.ts   configuração do Capacitor
db/schema.sql         modelo de dados (referência, ainda não aplicado)
.github/workflows/    pipeline de build e release
```

## Desenvolvimento

Requisitos: **Node.js 22+** e npm.

```bash
npm ci --legacy-peer-deps
npm run dev          # servidor local em http://localhost:5173
```

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run build` | Build de produção da web em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run typecheck` | Checagem de tipos (TypeScript) |
| `npm run electron:dev` | Build web + abre o app desktop |
| `npm run electron:build` | Gera o instalador Windows em `release/` |
| `npm run cap:sync` | Build web + copia para o projeto Android |
| `npm run android:open` | Abre o projeto no Android Studio |
| `npm run android:build` | Build web + sync + APK debug |

## Builds locais

**Web (PWA)**

```bash
npm run build        # saída em dist/ (caminhos relativos; pode ser hospedado em qualquer subpasta)
```

**Windows (.exe)** — de preferência em uma máquina Windows:

```bash
npm run electron:build
# release/Folio-Setup-<versão>.exe
```

**Android (.apk)** — requer **JDK 21** e **Android SDK** (Android Studio):

```bash
npm run android:build
# android/app/build/outputs/apk/debug/app-debug.apk
```

## CI e releases

O workflow [`.github/workflows/release.yml`](.github/workflows/release.yml) roda a cada push:

1. **windows** — instala dependências, checa tipos e gera o instalador NSIS.
2. **android** — gera o build web, sincroniza o Capacitor e compila o APK com Gradle (JDK 21).
3. **release** — em tags `v*`, em merges na `main` (quando a versão do `package.json` ainda não tem release) ou em commits com `[release]` na mensagem: publica o `.exe` e o `.apk` no GitHub Releases com instruções em pt-BR, criando a tag `v<versão>` automaticamente.

Para lançar uma versão:

```bash
npm version 1.0.1 --no-git-tag-version   # atualiza package.json (a versão do Android vem daqui)
git commit -am "release: v1.0.1"
git push            # ao chegar na main, a release v1.0.1 é publicada
# ou, em qualquer branch: inclua [release] na mensagem do commit,
# ou crie a tag manualmente: git tag v1.0.1 && git push --tags
```

Os artefatos de cada push também ficam disponíveis na aba **Actions** do GitHub.

## Roadmap

O plano completo está em [`ROADMAP.md`](ROADMAP.md) e as decisões técnicas em [`DECISOES.md`](DECISOES.md). Próximos passos:

- **Supabase** com autenticação real e RLS, substituindo o armazenamento local
- Chave da Groq no servidor (Edge Function)
- Assistente com RAG sobre a biblioteca científica
- Mapa muscular 3D e modo escuro
- Builds assinados (APK de release e instalador Windows)

## Ética e saúde

- O Folio é uma ferramenta de **organização e educação**. Não faz diagnóstico, não prescreve treino, dieta ou medicação e não incentiva práticas lesivas.
- Conteúdos de exercícios e comparativos biomecânicos são informativos e estão marcados **"a revisar por profissional"**.
- Sente dor, desconforto ou tem alguma condição de saúde? Procure um médico ou um profissional de Educação Física.
- As respostas da IA podem conter erros; confira sempre as fontes citadas.

## Licença

Nenhuma licença de código aberto foi definida. © Folio — **todos os direitos reservados**.
