import { ApprovalRequest } from '@metamask/approval-controller';
import { Hex, Json } from '@metamask/utils';
import { QuoteResponseV1 } from '@metamask/bridge-controller';

import { createSelector } from 'reselect';
import { getPendingApprovals } from '../../../selectors/approvals';
import { ConfirmMetamaskState } from '../types/confirm';
import { CONFIRMATION_APPROVAL_TYPES } from './confirmation-approval-types';

export const pendingConfirmationsSortedSelector = createSelector(
  getPendingApprovals,
  (approvals) =>
    approvals
      .filter(({ type }) => CONFIRMATION_APPROVAL_TYPES.includes(type))
      .sort((a1, a2) => a1.time - a2.time),
);

export const firstPendingConfirmationSelector = createSelector(
  pendingConfirmationsSortedSelector,
  (pendingConfirmations): ApprovalRequest<Record<string, Json>> | undefined =>
    pendingConfirmations[0],
);

export function selectDappSwapComparisonData(
  state: ConfirmMetamaskState,
  transactionId: string,
):
  | {
      quotes?: QuoteResponseV1[];
      latency?: number;
      commands?: string;
      error?: string;
      swapInfo?: {
        srcTokenAddress: Hex;
        destTokenAddress: Hex;
        srcTokenAmount: Hex;
        destTokenAmountMin: Hex;
      };
    }
  | undefined {
  return state.metamask.dappSwapComparisonData?.[transactionId] ?? undefined;
}
