import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/** Ensures a Supabase anonymous session exists before any RPC is attempted. */
export function useEnsureSession(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function ensure() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          await supabase.auth.signInAnonymously();
        }
      } catch {
        // Supabase에 연결할 수 없음(네트워크/설정 문제) — /diag에서 원인을 보여주므로
        // 여기서는 화면이 멈추지 않도록 그냥 다음 단계로 넘어간다.
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    ensure();
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
