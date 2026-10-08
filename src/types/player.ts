export type CharacterId =
  | "cat"
  | "dog"
  | "rabbit"
  | "bear"
  | "penguin"
  | "fox"
  | "panda"
  | "frog"
  | "duck"
  | "hamster"
  | "koala"
  | "owl";

export type ColorId = "red" | "orange" | "yellow" | "green" | "blue" | "purple";

export type PlayerStatus = "active" | "eliminated";

export interface CharacterCombo {
  characterId: CharacterId | null;
  colorId: ColorId | null;
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
