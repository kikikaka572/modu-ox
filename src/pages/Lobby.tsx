import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { MobileShell } from "@/components/layout/MobileShell";
import { ParticipantList } from "@/components/room/ParticipantList";
import { RoomCodeDisplay } from "@/components/room/RoomCodeDisplay";
import { useHostMigration } from "@/hooks/useHostMigration";
import { useRoomChannel } from "@/hooks/useRoomChannel";
import { startGame } from "@/lib/rpc";
import { supabase } from "@/lib/supabase";
import { useRoomStore } from "@/store/roomStore";
import { usePlayerStore } from "@/store/playerStore";
import type { PresencePayload } from "@/types/realtime";

export default function Lobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const room = useRoomStore((s) => s.room);
  const setRoom = useRoomStore((s) => s.setRoom);
  const myPlayerId = usePlayerStore((s) => s.myPlayerId);
  const players = usePlayerStore((s) => s.players);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [selfPresence, setSelfPresence] = useState<PresencePayload | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 방 + 내 플레이어 정보 로드(이 시점엔 이미 join_room을 마쳤으므로 RLS 통과).
  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    async function load() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id ?? null;
        if (cancelled) return;
        setMyUserId(userId);

        const { data: roomRow } = await supabase.from("rooms").select("*").eq("code", code).single();
        if (cancelled || !roomRow) return;
        setRoom({
          id: roomRow.id,
          code: roomRow.code,
          title: roomRow.title,
          hostId: roomRow.host_id,
          status: roomRow.status,
          currentQuestionIndex: roomRow.current_question_index,
          questionEndsAt: roomRow.question_ends_at,
          questions: [],
          hasAnyCorrectAnswerConfigured: false,
        });

        if (myPlayerId) {
          const { data: me } = await supabase
            .from("players")
            .select("*")
            .eq("id", myPlayerId)
            .single();
          if (!cancelled && me) {
            setSelfPresence({
              player_id: me.id,
              nickname: me.nickname,
              character_id: me.character_id,
              color_id: me.color_id,
              is_host: me.user_id === roomRow.host_id,
            });
          }
        }
      } catch {
        // 네트워크/Supabase 설정 문제 — "불러오는 중" 화면에 머물되, 앱이
        // 처리되지 않은 예외로 멈추지는 않는다(원인은 /diag에서 확인).
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [code, myPlayerId, setRoom]);

  const { onPresenceLeave, onPresenceJoin } = useHostMigration(room);
  useRoomChannel(code, selfPresence ?? undefined, { onPresenceLeave, onPresenceJoin });

  // 다른 플레이어들은 호스트가 시작하면 room.status 변경을 감지해 자동 이동한다.
  useEffect(() => {
    if (!room?.id) return;
    const channel = supabase
      .channel(`rooms-changes-${room.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` },
        (payload) => {
          if (payload.new.status === "QUESTION_ACTIVE") {
            navigate(`/room/${code}/game`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, code, navigate]);

  const isHost = Boolean(room && myUserId && room.hostId === myUserId);
  const playerList = Object.values(players);

  async function handleStart() {
    if (!room) return;
    setStarting(true);
    setError(null);
    try {
      await startGame(room.id);
      navigate(`/room/${code}/game`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "게임을 시작할 수 없습니다.");
      setStarting(false);
    }
  }

  if (!room) {
    return (
      <MobileShell>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-400">불러오는 중...</p>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-xl font-black text-[var(--color-ink)]">{room.title}</h1>
          <p className="text-sm text-gray-400">게임 시작을 기다리는 중...</p>
        </div>

        <RoomCodeDisplay code={room.code} />

        <ParticipantList players={playerList} myPlayerId={myPlayerId} />

        {error && <ErrorBanner message={error} />}

        {isHost && (
          <Button onClick={handleStart} disabled={starting || playerList.length < 1}>
            {starting ? "시작하는 중..." : "게임 시작"}
          </Button>
        )}
      </div>
    </MobileShell>
  );
}
