import { supabase } from "@/lib/supabase";

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export interface CreateRoomInput {
  title: string;
  questions: { text: string; correctAnswer: "O" | "X" | null }[];
}

export function createRoom(input: CreateRoomInput) {
  return call<{ room_id: string; code: string }>("create_room", {
    p_title: input.title,
    p_questions: input.questions.map((q) => ({
      text: q.text,
      correct_answer: q.correctAnswer,
    })),
  });
}

export function joinRoom(input: {
  code: string;
  nickname: string;
  characterId: number;
  colorId: number;
}) {
  return call<{
    player_id: string;
    room_id: string;
    is_spectator: boolean;
    room_status: string;
    server_now: string;
  }>("join_room", {
    p_code: input.code,
    p_nickname: input.nickname,
    p_character_id: input.characterId,
    p_color_id: input.colorId,
  });
}

export function rejoinRoom(code: string) {
  return call<{
    player_id: string;
    room_id: string;
    nickname: string;
    character_id: number | null;
    color_id: number | null;
    room_status: string;
    server_now: string;
  }>("rejoin_room", { p_code: code });
}

export function reassignCombo(playerId: string, characterId: number, colorId: number) {
  return call<{ player_id: string; character_id: number; color_id: number }>(
    "reassign_combo",
    { p_player_id: playerId, p_character_id: characterId, p_color_id: colorId }
  );
}

export function serverNow() {
  return call<string>("server_now");
}

export function startGame(roomId: string) {
  return call<{ status: string; question_ends_at: string }>("start_game", {
    p_room_id: roomId,
  });
}

export function lockQuestion(roomId: string) {
  return call<{ status: string }>("lock_question", { p_room_id: roomId });
}

export function submitAnswer(roomId: string, questionId: string, xPosition: number) {
  return call<{ judged_answer: "O" | "X" | null; accepted_at: string }>("submit_answer", {
    p_room_id: roomId,
    p_question_id: questionId,
    p_x_position: xPosition,
  });
}

export function revealQuestion(roomId: string) {
  return call<{
    correct_answer: "O" | "X" | null;
    results: { player_id: string; judged_answer: string | null; is_correct: boolean | null }[];
  }>("reveal_question", { p_room_id: roomId });
}

export function nextQuestion(roomId: string) {
  return call<{ status: string; current_question_index?: number; question_ends_at?: string }>(
    "next_question",
    { p_room_id: roomId }
  );
}

export function endGame(roomId: string) {
  return call<{
    ranking: { player_id: string; nickname: string; character_id: number; color_id: number; score: number }[];
  }>("end_game", { p_room_id: roomId });
}

export function markPlayerDisconnected(playerId: string) {
  return call<void>("mark_player_disconnected", { p_player_id: playerId });
}

export function releaseAbandonedCombos(code: string) {
  return call<{ released: { character_id: number; color_id: number }[] }>(
    "release_abandoned_combos",
    { p_code: code }
  );
}

export function migrateHost(roomId: string, expectedCurrentHost: string) {
  return call<{ new_host_user_id?: string; new_host_player_id?: string; status?: string }>(
    "migrate_host",
    { p_room_id: roomId, p_expected_current_host: expectedCurrentHost }
  );
}
