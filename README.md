# Content AI Studio

Ferramenta de criação de conteúdo para redes sociais com IA — inspirada no
fluxo "crie posts sem contratar designer". Você configura a identidade da sua
marca uma vez e gera posts, carrosséis e stories já com o seu logo, cores e
tipografia aplicados.

## Funcionalidades (MVP)

- **Onboarding em 6 passos**: objetivo, marca (nome/descrição/logo), público-alvo,
  identidade (tom de voz), estilo visual (paleta + tipografia) e conexões de redes.
- **Criação de conteúdo**: escolha de formato (Post Portrait, Carrossel, Stories,
  Post Quadrado, LinkedIn) e geração do texto por IA.
- **Arte com a marca**: o pôster é renderizado com a paleta, o logo e as fontes
  escolhidas, com título, destaque, texto de apoio e CTA.
- **Download em PNG** na resolução real do formato e galeria de criações salvas.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS v4
- `html-to-image` para exportar o pôster em PNG
- Geração de texto via OpenAI (com fallback "modo demo" sem chave)

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

## Configuração da IA

Sem chave configurada, o app roda em **modo demo**: o texto é gerado por um
modelo local de exemplo. Para usar a IA de verdade, defina as variáveis em um
arquivo `.env.local` (veja `.env.example`):

```
OPENAI_API_KEY=sk-...
# opcional
OPENAI_MODEL=gpt-4o-mini
```

## Estrutura

```
src/
  app/
    page.tsx            # landing
    onboarding/         # wizard de 6 passos
    dashboard/          # painel + galeria
    create/             # criação e geração
    api/generate/       # gera o texto do post (IA ou stub)
    api/status/         # informa se a IA está configurada
  components/
    PosterPreview.tsx   # arte da marca (render + export)
    AppNav.tsx
  lib/                  # tipos, paletas, formatos, contexto da marca
```

## Próximos passos

- Carrossel com múltiplos slides
- Geração de imagem de fundo por IA
- Publicação direta nas redes conectadas
- Persistência em banco de dados / contas de usuário
