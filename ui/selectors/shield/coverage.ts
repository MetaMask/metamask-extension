import {
  ShieldControllerState,
  type CoverageStatus,
} from '@metamask/shield-controller';

export type ShieldState = {
  metamask: ShieldControllerState;
};

export function getCoverageStatus(
  state: ShieldState,
  confirmationId: string | undefined,
): { status: CoverageStatus | undefined; reasonCode: string | undefined } {
  const coverageResults =
    typeof confirmationId === 'string'
      ? state.metamask.coverageResults[confirmationId]
      : undefined;
  if (
    !coverageResults ||
    !('results' in coverageResults) ||
    (coverageResults.results ?? []).length === 0
  ) {
    return { status: undefined, reasonCode: undefined };
  }

  const result = coverageResults.results[0];

  return {
    status: result.status,
    reasonCode: result.reasonCode,
  };
}
