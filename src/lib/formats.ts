import type { ContentFormat } from "./types";

export const FORMATS: ContentFormat[] = [
  {
    id: "post-portrait",
    name: "Post Portrait",
    network: "instagram",
    width: 1080,
    height: 1350,
    sizeLabel: "1080 x 1350px",
    description: "Post vertical para o feed do Instagram.",
    top: true,
  },
  {
    id: "carrossel-portrait",
    name: "Carrossel Portrait",
    network: "instagram",
    width: 1080,
    height: 1350,
    sizeLabel: "1080 x 1350px",
    description: "Vários slides verticais em sequência.",
    top: true,
  },
  {
    id: "stories-unico",
    name: "Stories Único",
    network: "instagram",
    width: 1080,
    height: 1920,
    sizeLabel: "1080 x 1920px",
    description: "Story em tela cheia.",
    top: true,
  },
  {
    id: "stories-carrossel",
    name: "Stories Carrossel",
    network: "instagram",
    width: 1080,
    height: 1920,
    sizeLabel: "1080 x 1920px",
    description: "Sequência de stories em tela cheia.",
  },
  {
    id: "post-quadrado",
    name: "Post Quadrado",
    network: "facebook",
    width: 1080,
    height: 1080,
    sizeLabel: "1080 x 1080px",
    description: "Post quadrado clássico para feed.",
  },
  {
    id: "linkedin-post",
    name: "Post LinkedIn",
    network: "linkedin",
    width: 1200,
    height: 1500,
    sizeLabel: "1200 x 1500px",
    description: "Post profissional para o LinkedIn.",
  },
];

export function getFormat(id: string): ContentFormat | undefined {
  return FORMATS.find((f) => f.id === id);
}
