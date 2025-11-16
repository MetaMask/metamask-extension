import {
  ShieldControllerState,
  type CoverageStatus,
} from '@metamask/shield-controller';

export type ShieldState = {
  metamask: ShieldControllerState;
};

export type CoverageStatusResult = {
  status: CoverageStatus | undefined;
  reasonCode: string | undefined;
};

export type CoverageMetrics = {
  latency?: number;
};

function getFirstCoverageResult(state: ShieldState, confirmationId: string) {
  const coverageResults = state.metamask.coverageResults?.[confirmationId];

  if (!coverageResults?.results?.length) {
    return undefined;
  }

  return coverageResults.results[0];
}

export function getCoverageStatus(
  state: ShieldState,
  confirmationId: string,
): CoverageStatusResult {
  const result = getFirstCoverageResult(state, confirmationId);

  return {
    status: result?.status,
    reasonCode: result?.reasonCode,
  };
}

export function getCoverageMetrics(
  state: ShieldState,
  confirmationId: string,
): CoverageMetrics | undefined {
  const result = getFirstCoverageResult(state, confirmationId);
  return result?.metrics;
}
