/**
 * Ready-made content ideas grouped by niche. Selecting one pre-fills the
 * "tema" field so the user starts from a proven angle instead of a blank page.
 */
export interface TemplateNiche {
  id: string;
  label: string;
  emoji: string;
  ideas: string[];
}

export const TEMPLATE_NICHES: TemplateNiche[] = [
  {
    id: "saude",
    label: "Saúde & Bem-estar",
    emoji: "🩺",
    ideas: [
      "3 hábitos simples para ter mais energia no dia a dia",
      "Mito x verdade sobre cuidar da saúde depois dos 40",
      "Checklist de exames que todo mundo deveria fazer no ano",
      "Como o sono afeta a sua saúde (e como melhorar hoje)",
      "Sinais do corpo que você não deve ignorar",
    ],
  },
  {
    id: "beleza",
    label: "Beleza & Estética",
    emoji: "💄",
    ideas: [
      "Passo a passo de skincare para pele oleosa",
      "Antes e depois: o poder de um bom cuidado capilar",
      "Erros comuns na maquiagem que envelhecem o visual",
      "Tendência da estação que você precisa testar",
      "Mitos sobre tratamentos estéticos desmentidos",
    ],
  },
  {
    id: "food",
    label: "Alimentação & Gastronomia",
    emoji: "🍔",
    ideas: [
      "Receita rápida e barata para o jantar de hoje",
      "Combo promocional da semana — peça já",
      "Os bastidores de como preparamos o nosso prato mais pedido",
      "3 motivos para escolher a gente no seu próximo pedido",
      "Novidade no cardápio: apresente o lançamento",
    ],
  },
  {
    id: "fitness",
    label: "Fitness & Academia",
    emoji: "💪",
    ideas: [
      "Treino de 15 minutos para fazer em casa",
      "Erros que travam a sua evolução na academia",
      "Depoimento de aluno: transformação real",
      "Como manter a constância nos treinos",
      "Mito x verdade sobre emagrecimento",
    ],
  },
  {
    id: "moda",
    label: "Moda & Vestuário",
    emoji: "👗",
    ideas: [
      "3 looks com a mesma peça do nosso catálogo",
      "Tendências da estação que já estão na loja",
      "Como montar um look para cada ocasião",
      "Coleção nova: apresente os destaques",
      "Promoção relâmpago — só hoje",
    ],
  },
  {
    id: "servicos",
    label: "Serviços & Negócios locais",
    emoji: "🛠️",
    ideas: [
      "Antes e depois de um serviço que fizemos",
      "Por que escolher a gente: nossos diferenciais",
      "Dúvida frequente dos clientes respondida",
      "Promoção para novos clientes este mês",
      "Bastidores: conheça quem faz acontecer",
    ],
  },
  {
    id: "educacao",
    label: "Educação & Cursos",
    emoji: "🎓",
    ideas: [
      "3 dicas para aprender mais rápido",
      "O que você vai dominar no nosso curso",
      "Depoimento de aluno que mudou de vida",
      "Erro comum que atrapalha quem está começando",
      "Turma nova abrindo — garanta a vaga",
    ],
  },
  {
    id: "imobiliario",
    label: "Imobiliário",
    emoji: "🏠",
    ideas: [
      "Imóvel em destaque da semana — agende a visita",
      "Checklist para quem vai comprar o primeiro imóvel",
      "Bairro em alta: por que investir agora",
      "Tour pelo imóvel dos sonhos",
      "Mitos sobre financiamento imobiliário",
    ],
  },
  {
    id: "datas",
    label: "Datas comemorativas",
    emoji: "🎉",
    ideas: [
      "Mensagem especial de Dia das Mães para os clientes",
      "Promoção de Black Friday — ofertas imperdíveis",
      "Feliz Natal: agradecimento aos clientes do ano",
      "Dia do Cliente: oferta exclusiva de agradecimento",
      "Volta às aulas: condições especiais",
    ],
  },
];

/** Background scene templates for different niches - AI generates perfect backdrops */
export interface BackgroundTemplate {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
}

export const BACKGROUND_TEMPLATES: BackgroundTemplate[] = [
  {
    id: "luxury-product",
    label: "Produto Premium",
    emoji: "✨",
    prompt: "a luxury product studio with dramatic spotlight lighting, glossy black marble surface, golden reflections, premium commercial photography setup, 8k ultra detailed, clean minimalist background, professional advertising style --ar 9:16",
  },
  {
    id: "lifestyle",
    label: "Lifestyle Natural",
    emoji: "🌅",
    prompt: "a bright lifestyle scene with natural soft lighting, clean white background with subtle shadows, organic textures, airy atmosphere, professional content creation setup, commercial photography --ar 9:16",
  },
  {
    id: "fitness-studio",
    label: "Academia",
    emoji: "💪",
    prompt: "a modern gym interior with blue neon lighting, concrete walls, dramatic sports photography style, energetic atmosphere, premium fitness brand aesthetic, commercial workout setup --ar 9:16",
  },
  {
    id: "beauty-flatlay",
    label: "Flatlay Beleza",
    emoji: "💄",
    prompt: "a beauty flatlay setup with soft pastel lighting, marble vanity surface, cosmetic props, elegant cosmetics background, boutique aesthetic, commercial beauty photography --ar 9:16",
  },
  {
    id: "food-studio",
    label: "Gastronomia",
    emoji: "🍽️",
    prompt: "a professional food photography studio with warm golden lighting, rustic wooden table, subtle shadows, gourmet restaurant aesthetic, commercial food branding setup --ar 9:16",
  },
  {
    id: "fashion-retro",
    label: "Moda Urbana",
    emoji: "👗",
    prompt: "urban fashion scene with trendy street backdrop, soft pink and blue gradient lighting, concrete wall with street art, modern editorial style, commercial fashion shoot --ar 9:16",
  },
  {
    id: "tech-neon",
    label: "Tecnologia",
    emoji: "💻",
    prompt: "a tech product studio with futuristic blue purple neon lighting, dark concrete surface, digital glow effects, modern technology aesthetic, commercial gadget photography --ar 9:16",
  },
];
