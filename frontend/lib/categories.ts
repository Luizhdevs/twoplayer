export const CATEGORIES = [
  "Games",
  "Esports",
  "Futebol",
  "Basquete",
  "Tênis",
  "Vôlei",
  "Streaming",
  "YouTube",
  "TikTok",
  "Coaching",
  "Mentoria",
  "Bate-papo",
  "Autógrafo",
  "Lives",
  "Música",
  "Fitness",
] as const;

export type Category = (typeof CATEGORIES)[number];
