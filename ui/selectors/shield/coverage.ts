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
  console.log('coverageResults', coverageResults);
  // return 'unknown';
  if (!coverageResults || coverageResults.results.length === 0) {
    return undefined;
  }

  // TODO: get coverage results from the backend working
  return coverageResults.results[0].status;
}
