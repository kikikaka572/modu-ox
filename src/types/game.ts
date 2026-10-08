export type RoundPhase = "waiting" | "countdown" | "locked" | "revealed";

export interface Position {
  x: number;
  y: number;
}

export interface RevealResult {
  correctZone: "O" | "X" | null;
  oCount: number;
  xCount: number;
}

export interface RankingEntry {
  playerId: string;
  nickname: string;
  characterId: number | null;
  colorId: number | null;
  correctCount: number;
  rank: number;
}
