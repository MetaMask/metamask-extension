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
): { status: CoverageStatus | undefined; reasonCode: string | undefined } {
  const coverageResults = state.metamask.coverageResults[confirmationId];
  if (!coverageResults || coverageResults.results.length === 0) {
    return { status: undefined, reasonCode: undefined };
  }

  const result = coverageResults.results[0];

  return {
    status: result.status,
    reasonCode: result.reasonCode,
  };
}
