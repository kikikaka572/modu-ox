export interface ColorToken {
  id: number;
  nameKo: string;
  body: string;
  accent: string;
  belly: string;
}

export const COLOR_PALETTE: ColorToken[] = [
  { id: 1, nameKo: "레드", body: "oklch(62% 0.21 25)", accent: "oklch(45% 0.2 25)", belly: "oklch(96% 0.02 25)" },
  { id: 2, nameKo: "오렌지", body: "oklch(72% 0.17 55)", accent: "oklch(55% 0.19 50)", belly: "oklch(96% 0.03 55)" },
  { id: 3, nameKo: "삐로우", body: "oklch(85% 0.17 95)", accent: "oklch(68% 0.16 85)", belly: "oklch(97% 0.03 95)" },
  { id: 4, nameKo: "그린", body: "oklch(70% 0.17 150)", accent: "oklch(52% 0.15 150)", belly: "oklch(96% 0.03 150)" },
  { id: 5, nameKo: "블루", body: "oklch(62% 0.18 255)", accent: "oklch(45% 0.18 255)", belly: "oklch(96% 0.02 255)" },
  { id: 6, nameKo: "퍼플", body: "oklch(62% 0.2 300)", accent: "oklch(45% 0.19 300)", belly: "oklch(96% 0.02 300)" },
];

export function colorById(id: number): ColorToken {
  const found = COLOR_PALETTE.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown color id: ${id}`);
  return found;
}
