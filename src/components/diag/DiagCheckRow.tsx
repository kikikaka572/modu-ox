import { cn } from "@/lib/cn";
import type { DiagCheckState } from "@/types/diag";
import { DiagResultDetail } from "./DiagResultDetail";

interface DiagCheckRowProps {
  label: string;
  description: string;
  state: DiagCheckState;
  firewallHint?: string;
}

function StatusGlyph({ status }: { status: DiagCheckState["status"] }) {
  if (status === "success") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-o-zone)] text-xl font-black text-white">
        O
      </span>
    );
  }
  if (status === "fail") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-x-zone)] text-xl font-black text-white">
        X
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
      </span>
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-200 text-gray-300">
      –
    </span>
  );
}

function statusLabel(state: DiagCheckState): string {
  switch (state.status) {
    case "pending":
      return "대기 중";
    case "running":
      return "확인 중...";
    case "success":
      return state.detail ? `성공 (${state.detail})` : "성공";
    case "fail":
      return "실패";
  }
}

export function DiagCheckRow({ label, description, state, firewallHint }: DiagCheckRowProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        state.status === "fail" ? "border-[var(--color-x-zone)]/40" : "border-gray-200"
      )}
    >
      <div className="flex items-center gap-4">
        <StatusGlyph status={state.status} />
        <div className="flex-1">
          <p className="font-semibold text-[var(--color-ink)]">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <span className="shrink-0 text-sm font-medium text-gray-600">{statusLabel(state)}</span>
      </div>
      {state.status === "fail" && firewallHint && <DiagResultDetail message={firewallHint} />}
      {state.status === "fail" && <DiagResultDetail message={`원인: ${state.reason}`} />}
    </div>
  );
}
