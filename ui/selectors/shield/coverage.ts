import {
  ShieldControllerState,
  type CoverageStatus,
} from '@metamask/shield-controller';

export type ShieldState = {
  metamask: ShieldControllerState;
};

export function getCoverageStatus(
  state: ShieldState,
  confirmationId: string,
): CoverageStatus | undefined {
  const coverageResults = state.metamask.coverageResults[confirmationId];
  if (!coverageResults || coverageResults.results.length === 0) {
    return undefined;
  }

  return coverageResults.results[0].status;
}
