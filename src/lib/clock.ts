/** Returns the current server-equivalent epoch ms given a previously computed offset. */
export function now(offsetMs: number): number {
  return Date.now() + offsetMs;
}

interface OffsetSample {
  offsetMs: number;
  roundTripMs: number;
}

/**
 * Computes one clock-offset sample using a single server_now() round trip.
 * Assumes symmetric latency: the server's reported instant is assumed to have
 * occurred at the midpoint between request send and response receipt.
 */
export function computeOffsetSample(
  localSendMs: number,
  localReceiveMs: number,
  serverEpochMs: number
): OffsetSample {
  const roundTripMs = localReceiveMs - localSendMs;
  const estimatedLocalTimeAtServerMoment = localSendMs + roundTripMs / 2;
  const offsetMs = serverEpochMs - estimatedLocalTimeAtServerMoment;
  return { offsetMs, roundTripMs };
}

/** Picks the sample with the smallest round trip time (least jitter error). */
export function bestOffsetSample(samples: OffsetSample[]): number {
  if (samples.length === 0) return 0;
  return samples.reduce((best, sample) =>
    sample.roundTripMs < best.roundTripMs ? sample : best
  ).offsetMs;
}
