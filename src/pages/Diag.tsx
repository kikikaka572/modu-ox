import { useCallback, useEffect, useReducer } from "react";
import { DiagCheckRow } from "@/components/diag/DiagCheckRow";
import {
  checkBroadcastLatency,
  checkRealtimeConnection,
  checkRestReachability,
  FIREWALL_HINT_KO,
} from "@/lib/network/diagChecks";
import type { DiagCheckId, DiagCheckState } from "@/types/diag";

const CHECKS: { id: DiagCheckId; label: string; description: string; showFirewallHint: boolean }[] = [
  {
    id: "rest",
    label: "Supabase REST 응답",
    description: "일반 HTTP API(REST) 서버에 도달할 수 있는지 확인합니다.",
    showFirewallHint: true,
  },
  {
    id: "realtime",
    label: "Realtime WebSocket 연결",
    description: "실시간 동기화에 쓰이는 WebSocket 연결이 가능한지 확인합니다.",
    showFirewallHint: true,
  },
  {
    id: "broadcast",
    label: "Broadcast 왕복 지연",
    description: "메시지를 보내고 받는 데 걸리는 시간을 측정합니다.",
    showFirewallHint: false,
  },
];

type DiagState = Record<DiagCheckId, DiagCheckState>;

type DiagAction = { type: "set"; id: DiagCheckId; state: DiagCheckState } | { type: "reset" };

const INITIAL_STATE: DiagState = {
  rest: { status: "pending" },
  realtime: { status: "pending" },
  broadcast: { status: "pending" },
};

function reducer(state: DiagState, action: DiagAction): DiagState {
  if (action.type === "reset") return INITIAL_STATE;
  return { ...state, [action.id]: action.state };
}

function maskedSupabaseHost(): string {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  if (!url) return "(설정 안 됨)";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export default function Diag() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const runChecks = useCallback(async () => {
    dispatch({ type: "reset" });

    dispatch({ type: "set", id: "rest", state: { status: "running" } });
    const restResult = await checkRestReachability();
    dispatch({
      type: "set",
      id: "rest",
      state: restResult.ok
        ? { status: "success", detail: restResult.detail }
        : { status: "fail", reason: restResult.reason ?? "알 수 없는 오류" },
    });

    dispatch({ type: "set", id: "realtime", state: { status: "running" } });
    const realtimeResult = await checkRealtimeConnection();
    dispatch({
      type: "set",
      id: "realtime",
      state: realtimeResult.ok
        ? { status: "success" }
        : { status: "fail", reason: realtimeResult.reason ?? "알 수 없는 오류" },
    });

    dispatch({ type: "set", id: "broadcast", state: { status: "running" } });
    const broadcastResult = await checkBroadcastLatency();
    dispatch({
      type: "set",
      id: "broadcast",
      state: broadcastResult.ok
        ? { status: "success", detail: broadcastResult.detail }
        : { status: "fail", reason: broadcastResult.reason ?? "알 수 없는 오류" },
    });
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">네트워크 진단</h1>
        <p className="mt-1 text-sm text-gray-500">Supabase: {maskedSupabaseHost()}</p>
      </header>

      <div className="flex flex-col gap-3">
        {CHECKS.map((check) => (
          <DiagCheckRow
            key={check.id}
            label={check.label}
            description={check.description}
            state={state[check.id]}
            firewallHint={check.showFirewallHint ? FIREWALL_HINT_KO : undefined}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={runChecks}
        className="mt-auto w-full rounded-xl bg-[var(--color-ink)] py-3 font-semibold text-white"
      >
        다시 검사
      </button>
    </div>
  );
}
