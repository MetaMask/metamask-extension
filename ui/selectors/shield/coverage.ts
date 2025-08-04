import {
  ShieldControllerState,
  CoverageStatus,
} from '@metamask/shield-controller';

export type ShieldState = {
  metamask: ShieldControllerState;
};

export function getCoverageStatus(
  state: ShieldState,
  transactionId: string,
): CoverageStatus | undefined {
  for (const r of state.metamask.coverageResults) {
    if (r.txId === transactionId) {
      return r.status;
    }
  }

  return undefined;
}
