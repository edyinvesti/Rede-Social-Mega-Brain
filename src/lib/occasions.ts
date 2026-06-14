export interface Occasion {
  /** 1-12 */
  month: number;
  /** 1-31 */
  day: number;
  label: string;
}

/** Datas comemorativas brasileiras úteis para pauta de conteúdo. */
export const OCCASIONS: Occasion[] = [
  { month: 1, day: 1, label: "Ano Novo" },
  { month: 2, day: 14, label: "Dia dos Namorados (intl.)" },
  { month: 3, day: 8, label: "Dia da Mulher" },
  { month: 3, day: 15, label: "Dia do Consumidor" },
  { month: 4, day: 22, label: "Descobrimento do Brasil" },
  { month: 5, day: 1, label: "Dia do Trabalho" },
  { month: 5, day: 11, label: "Dia das Mães" },
  { month: 6, day: 5, label: "Dia do Meio Ambiente" },
  { month: 6, day: 12, label: "Dia dos Namorados" },
  { month: 6, day: 24, label: "São João / Festa Junina" },
  { month: 7, day: 26, label: "Dia dos Avós" },
  { month: 8, day: 11, label: "Dia dos Pais" },
  { month: 9, day: 7, label: "Independência do Brasil" },
  { month: 9, day: 15, label: "Dia do Cliente" },
  { month: 10, day: 12, label: "Dia das Crianças" },
  { month: 10, day: 15, label: "Dia do Professor" },
  { month: 11, day: 15, label: "Proclamação da República" },
  { month: 11, day: 28, label: "Black Friday" },
  { month: 12, day: 25, label: "Natal" },
  { month: 12, day: 31, label: "Réveillon" },
];

/**
 * Returns the commemorative dates within `windowDays` from `from` (inclusive),
 * ordered by proximity. Wraps around the end of the year.
 */
export function upcomingOccasions(
  from: Date = new Date(),
  windowDays = 45,
): Array<Occasion & { inDays: number }> {
  const year = from.getFullYear();
  const startUtc = Date.UTC(year, from.getMonth(), from.getDate());
  const dayMs = 86_400_000;
  return OCCASIONS.map((o) => {
    let target = Date.UTC(year, o.month - 1, o.day);
    if (target < startUtc) target = Date.UTC(year + 1, o.month - 1, o.day);
    const inDays = Math.round((target - startUtc) / dayMs);
    return { ...o, inDays };
  })
    .filter((o) => o.inDays <= windowDays)
    .sort((a, b) => a.inDays - b.inDays);
}
