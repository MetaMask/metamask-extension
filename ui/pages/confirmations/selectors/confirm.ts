import { ApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { Hex, Json } from '@metamask/utils';
import { QuoteResponse } from '@metamask/bridge-controller';

import { createSelector } from 'reselect';
import { getPendingApprovals } from '../../../selectors/approvals';
import { ConfirmMetamaskState } from '../types/confirm';

const ConfirmationApprovalTypes = [
  ApprovalType.PersonalSign,
  ApprovalType.EthSignTypedData,
  ApprovalType.Transaction,
];
export const pendingConfirmationsSortedSelector = createSelector(
  getPendingApprovals,
  (approvals) =>
    approvals
      .filter(({ type }) =>
        ConfirmationApprovalTypes.includes(type as ApprovalType),
      )
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
      quotes?: QuoteResponse[];
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
