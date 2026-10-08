import { supabase } from "@/lib/supabase";

export const FIREWALL_HINT_KO =
  "사내망/방화벽이 *.supabase.co 접속(또는 WebSocket)을 차단하고 있을 수 있습니다. 담당 IT팀에 해당 도메인 허용을 요청하세요.";

const REST_TIMEOUT_MS = 5_000;
const REALTIME_TIMEOUT_MS = 5_000;
const BROADCAST_TIMEOUT_MS = 5_000;

export interface CheckResult {
  ok: boolean;
  detail?: string;
  reason?: string;
}

/** Any HTTP response (including 401/404) proves the network path is open. */
export async function checkRestReachability(): Promise<CheckResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  if (!supabaseUrl) {
    return { ok: false, reason: "VITE_SUPABASE_URL이 설정되지 않았습니다." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REST_TIMEOUT_MS);

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "",
      },
      signal: controller.signal,
    });
    return { ok: true, detail: `HTTP ${response.status}` };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return { ok: false, reason: message };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkRealtimeConnection(): Promise<CheckResult> {
  return new Promise((resolve) => {
    const channel = supabase.channel("diag-ws-test");
    let settled = false;

    const finish = (result: CheckResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
      resolve(result);
    };

    const timeoutId = setTimeout(() => {
      finish({ ok: false, reason: "연결 시간 초과(5초)" });
    }, REALTIME_TIMEOUT_MS);

    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        finish({ ok: true });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        finish({ ok: false, reason: err?.message ?? `채널 상태: ${status}` });
      }
    });
  });
}

export async function checkBroadcastLatency(): Promise<CheckResult> {
  return new Promise((resolve) => {
    const channel = supabase.channel("diag-broadcast-test", {
      config: { broadcast: { self: true } },
    });
    let settled = false;

    const finish = (result: CheckResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
      resolve(result);
    };

    const timeoutId = setTimeout(() => {
      finish({ ok: false, reason: "응답 시간 초과(5초)" });
    }, BROADCAST_TIMEOUT_MS);

    channel
      .on("broadcast", { event: "ping" }, (message) => {
        const sentAt = (message.payload as { sentAt: number }).sentAt;
        const roundTripMs = Math.round(performance.now() - sentAt);
        finish({ ok: true, detail: `${roundTripMs}ms` });
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.send({
            type: "broadcast",
            event: "ping",
            payload: { sentAt: performance.now() },
          });
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          finish({ ok: false, reason: `채널 상태: ${status}` });
        }
      });
  });
}
