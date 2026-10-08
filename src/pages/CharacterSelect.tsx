import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { CharacterGrid } from "@/components/character/CharacterGrid";
import { CharacterPreview } from "@/components/character/CharacterPreview";
import { RandomPickButton } from "@/components/character/RandomPickButton";
import { MobileShell } from "@/components/layout/MobileShell";
import { useRoomChannel } from "@/hooks/useRoomChannel";
import { joinRoom, reassignCombo, rejoinRoom, releaseAbandonedCombos } from "@/lib/rpc";
import { COMBO_RELEASE_TIMEOUT_MS } from "@/lib/constants";
import { MAX_NICKNAME_LENGTH } from "@/lib/constants";
import { usePlayerStore } from "@/store/playerStore";

const ERROR_MESSAGES: Record<string, string> = {
  NICKNAME_TAKEN: "이미 사용 중인 닉네임입니다.",
  COMBO_TAKEN: "방금 다른 사람이 같은 캐릭터를 선택했습니다. 다시 선택해주세요.",
  ROOM_NOT_FOUND: "해당 코드의 방을 찾을 수 없습니다.",
  ROOM_FULL: "방 정원이 가득 찼습니다.",
  ALREADY_JOINED: "이미 이 방에 참가 중입니다.",
};

export default function CharacterSelect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const takenCombos = usePlayerStore((s) => s.takenCombos);
  const setMyPlayerId = usePlayerStore((s) => s.setMyPlayerId);

  useRoomChannel(code);

  // 재접속 확인 중(기존 players 행이 있는지)에는 선택 화면을 보여주지 않는다.
  const [checkingRejoin, setCheckingRejoin] = useState(true);
  const [rejoinedPlayerId, setRejoinedPlayerId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [combo, setCombo] = useState<{ characterId: number; colorId: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    rejoinRoom(code)
      .then((result) => {
        if (cancelled) return;
        setMyPlayerId(result.player_id);
        if (result.character_id && result.color_id) {
          // 콤보가 아직 해제되지 않았다 — 바로 로비/게임으로 복귀.
          navigate(`/room/${code}/lobby`, { replace: true });
        } else {
          // 콤보가 60초 유예 후 해제됐다 — 새 콤보만 다시 선택하면 된다.
          setRejoinedPlayerId(result.player_id);
          setCheckingRejoin(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCheckingRejoin(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code, navigate, setMyPlayerId]);

  // 콤보 해제(60초 유예 경과) 주기적 트리거 — 이 화면에 있는 누구든 호출 가능.
  useEffect(() => {
    if (!code) return;
    const interval = setInterval(() => {
      releaseAbandonedCombos(code).catch(() => {});
    }, COMBO_RELEASE_TIMEOUT_MS / 4);
    return () => clearInterval(interval);
  }, [code]);

  const canSubmit = (rejoinedPlayerId || nickname.trim().length > 0) && combo !== null && !submitting;

  async function handleSubmit() {
    if (!canSubmit || !combo || !code) return;
    setSubmitting(true);
    setError(null);
    try {
      if (rejoinedPlayerId) {
        await reassignCombo(rejoinedPlayerId, combo.characterId, combo.colorId);
        navigate(`/room/${code}/lobby`);
        return;
      }

      const result = await joinRoom({
        code,
        nickname: nickname.trim(),
        characterId: combo.characterId,
        colorId: combo.colorId,
      });
      setMyPlayerId(result.player_id);
      navigate(`/room/${code}/lobby`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "INVALID_NICKNAME";
      setError(ERROR_MESSAGES[message] ?? "입장에 실패했습니다. 다시 시도해주세요.");
      if (message === "COMBO_TAKEN") setCombo(null);
      setSubmitting(false);
    }
  }

  if (checkingRejoin) {
    return (
      <MobileShell>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-400">확인 중...</p>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col gap-5 px-6 py-6">
        <h1 className="text-xl font-black text-[var(--color-ink)]">캐릭터를 선택하세요</h1>

        {!rejoinedPlayerId && (
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, MAX_NICKNAME_LENGTH))}
            placeholder="닉네임 (최대 8자)"
            className="min-h-11 w-full rounded-xl border border-gray-200 px-4 py-2"
          />
        )}

        {combo && <CharacterPreview characterId={combo.characterId} colorId={combo.colorId} />}

        <RandomPickButton
          takenCombos={takenCombos}
          onPick={(characterId, colorId) => setCombo({ characterId, colorId })}
        />

        <div className="flex-1 overflow-y-auto">
          <CharacterGrid
            selected={combo}
            takenCombos={takenCombos}
            onSelect={(characterId, colorId) => setCombo({ characterId, colorId })}
          />
        </div>

        {error && <ErrorBanner message={error} />}

        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? "입장 중..." : "입장하기"}
        </Button>
      </div>
    </MobileShell>
  );
}
