export type RoomStatus =
  | "LOBBY"
  | "QUESTION_ACTIVE"
  | "QUESTION_LOCKED"
  | "REVEAL"
  | "FINISHED";

export interface Question {
  id: string;
  idx: number;
  text: string;
}

export interface Room {
  id: string;
  code: string;
  title: string;
  hostId: string;
  status: RoomStatus;
  currentQuestionIndex: number;
  questionEndsAt: string | null;
  questions: Question[];
  hasAnyCorrectAnswerConfigured: boolean;
}

export interface RevealedAnswer {
  questionId: string;
  correctAnswer: "O" | "X" | null;
  revealedAt: string;
}
