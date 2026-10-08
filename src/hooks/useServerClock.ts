import { useEffect } from "react";
import { bestOffsetSample, computeOffsetSample } from "@/lib/clock";
import { serverNow } from "@/lib/rpc";
import { useConnectionStore } from "@/store/connectionStore";

const SAMPLE_COUNT = 3;

/** Samples server_now() a few times and stores the best (lowest-RTT) clock offset. */
export function useServerClock(enabled: boolean) {
  const setServerOffsetMs = useConnectionStore((s) => s.setServerOffsetMs);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function sync() {
      const samples = [];
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const sendMs = Date.now();
        try {
          const serverIso = await serverNow();
          const receiveMs = Date.now();
          samples.push(computeOffsetSample(sendMs, receiveMs, Date.parse(serverIso)));
        } catch {
          // 네트워크 실패 시 해당 샘플만 건너뛴다.
        }
      }
      if (!cancelled && samples.length > 0) {
        setServerOffsetMs(bestOffsetSample(samples));
      }
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [enabled, setServerOffsetMs]);
}
