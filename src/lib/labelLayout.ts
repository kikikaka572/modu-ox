export interface LabelToken {
  playerId: string;
  pixelX: number;
  pixelY: number;
  isMine: boolean;
}

export interface LabelLayoutOptions {
  clusterThresholdPx: number;
  stackStepPx: number;
  maxStackDepth: number;
}

export interface LabelOffset {
  yOffset: number;
  compact: boolean;
}

/**
 * Greedy vertical-stacking within horizontal-proximity clusters.
 * Tokens closer than `clusterThresholdPx` (sorted by x) are grouped; within
 * a cluster, labels stack upward ordered by their token's y (topmost token
 * gets the topmost label slot). Beyond `maxStackDepth`, extra labels compact
 * into a "+N" badge — except "my" label, which is never compacted.
 */
export function computeLabelOffsets(
  tokens: LabelToken[],
  opts: LabelLayoutOptions
): Record<string, LabelOffset> {
  const result: Record<string, LabelOffset> = {};
  if (tokens.length === 0) return result;

  const sortedByX = [...tokens].sort((a, b) => a.pixelX - b.pixelX);

  let clusterStart = 0;
  for (let i = 1; i <= sortedByX.length; i++) {
    const endOfCluster =
      i === sortedByX.length || sortedByX[i].pixelX - sortedByX[i - 1].pixelX >= opts.clusterThresholdPx;

    if (endOfCluster) {
      const cluster = sortedByX.slice(clusterStart, i).sort((a, b) => a.pixelY - b.pixelY);
      cluster.forEach((token, indexInCluster) => {
        const compact = indexInCluster >= opts.maxStackDepth && !token.isMine;
        result[token.playerId] = {
          yOffset: indexInCluster * opts.stackStepPx,
          compact,
        };
      });
      clusterStart = i;
    }
  }

  return result;
}
