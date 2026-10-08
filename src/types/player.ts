export type PlayerStatus = "active" | "eliminated";

export interface CharacterCombo {
  characterId: number | null;
  colorId: number | null;
}

export interface Player extends CharacterCombo {
  id: string;
  nickname: string;
  isHost: boolean;
  status: PlayerStatus;
  correctCount: number;
  joinedAt: string;
  isSpectatorForCurrentQuestion: boolean;
}
