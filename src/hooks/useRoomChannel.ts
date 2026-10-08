import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { markPlayerDisconnected } from "@/lib/rpc";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import type { CursorMovePayload, PresencePayload } from "@/types/realtime";
import { REALTIME_EVENTS, roomChannelName } from "@/types/realtime";

/**
 * Subscribes to the room's shared Presence/Broadcast channel.
 * Presence is keyed by the anonymous auth.uid() (stable from first mount,
 * known before a `players` row exists) rather than player_id, since a
 * visitor browsing CharacterSelect hasn't joined yet and has no player_id.
 *
 * If `selfPresence` is provided, this client tracks its own presence
 * immediately on subscribe (used once the caller knows its own combo).
 */
interface RoomChannelOptions {
  /** presence key(= auth.uid())가 사라졌을 때 호출 — 호스트 이탈 감지에 사용. */
  onPresenceLeave?: (key: string) => void;
  onPresenceJoin?: (key: string) => void;
}

export function useRoomChannel(
  code: string | undefined,
  selfPresence?: PresencePayload,
  options?: RoomChannelOptions
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [ready, setReady] = useState(false);
  const setPlayers = usePlayerStore((s) => s.setPlayers);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const trackedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    async function connect() {
      let presenceKey: string = crypto.randomUUID();
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user.id) presenceKey = data.session.user.id;
      } catch {
        // 세션 조회 실패 — 임시 key로 계속 진행(이 경우 어차피 채널 구독 자체도
        // 네트워크가 막혀 있으면 실패하며, 그 실패는 /diag에서 확인 가능하다).
      }
      if (cancelled) return;

      const channel = supabase.channel(roomChannelName(code as string), {
        config: { broadcast: { self: false }, presence: { key: presenceKey } },
      });

      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresencePayload>();
        // score/correctCount/joinedAt는 Presence에 없다(DB에서만 알 수 있는 값) —
        // 기존에 DB로 받아둡 값이 있으면 보존하고, 정체성/접속 필드만 갱신한다.
        const existing = usePlayerStore.getState().players;
        const players = Object.values(state)
          .flat()
          .map((p) => {
            const prior = existing[p.player_id];
            return {
              id: p.player_id,
              nickname: p.nickname,
              characterId: p.character_id,
              colorId: p.color_id,
              isHost: p.is_host,
              status: prior?.status ?? ("active" as const),
              correctCount: prior?.correctCount ?? 0,
              joinedAt: prior?.joinedAt ?? new Date().toISOString(),
              isSpectatorForCurrentQuestion: prior?.isSpectatorForCurrentQuestion ?? false,
            };
          });
        setPlayers(players);
      });

      channel.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        optionsRef.current?.onPresenceLeave?.(key);
        // 이탈한 플레이어는 누구든 관찰한 클라이언트가 disconnected_at을 기록한다
        // (멱등적 — 처음 호출만 실제로 반영됨). 60초 후 콤보 해제의 기준 시각이 된다.
        for (const presence of leftPresences as unknown as PresencePayload[]) {
          markPlayerDisconnected(presence.player_id).catch(() => {});
        }
      });
      channel.on("presence", { event: "join" }, ({ key }) => {
        optionsRef.current?.onPresenceJoin?.(key);
      });

      // 다른 플레이어의 좌표 브로드캐스트 — 게임 화면이 아니면 아무도 보내지
      // 않으므로 다른 페이지에서는 사실상 no-op이다. self:false이므로 자신이
      // 보낸 좌표는 애초에 전달되지 않는다(별도 필터링 불필요).
      channel.on("broadcast", { event: REALTIME_EVENTS.cursorMove }, ({ payload }) => {
        const p = payload as CursorMovePayload;
        useGameStore.getState().setRawPosition(p.player_id, { x: p.x, y: p.y });
      });

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          trackedKeyRef.current = null;
          setReady(true);
        }
      });

      channelRef.current = channel;
    }

    connect();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // selfPresence는 보통 비동기 DB 조회 이후에야 준비되므로(채널이 이미
  // SUBSCRIBED된 뒤 도착하는 경우가 흔함), 구독 시점과 별개로 "ready이고
  // selfPresence가 있으면 track"을 항상 재확인하는 별도 effect가 필요하다.
  useEffect(() => {
    if (!ready || !selfPresence || !channelRef.current) return;
    const key = JSON.stringify(selfPresence);
    if (trackedKeyRef.current === key) return;
    trackedKeyRef.current = key;
    channelRef.current.track(selfPresence);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selfPresence]);

  return { channelRef, ready };
}
