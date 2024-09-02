import { ApprovalType } from '@metamask/controller-utils';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import mockState from '../mock-state.json';
import { CHAIN_IDS } from '../../../shared/constants/network';

type RootState = { metamask: Record<string, unknown> } & Record<
  string,
  unknown
>;

export const getMockTypedSignConfirmState = (
  args: RootState = { metamask: {} },
) => ({
  ...mockState,
  ...args,
  metamask: {
    ...mockState.metamask,
    preferences: {
      redesignedTransactionsEnabled: true,
      redesignedConfirmationsEnabled: true,
      isRedesignedConfirmationsDeveloperEnabled: true,
    },
    pendingApprovals: {
      '123': {
        id: '123',
        type: ApprovalType.EthSignTypedData,
      },
    },
    unapprovedTypedMessages: {
      '123': {
        id: '123',
        chainId: CHAIN_IDS.GOERLI,
        type: TransactionType.signTypedData,
        status: TransactionStatus.unapproved,
        txParams: { from: Object.keys(mockState.metamask.identities)[0] },
        msgParams: {
          signatureMethod: 'eth_signTypedData_v4',
        },
      },
    },
    ...args.metamask,
  },
});

export const getMockContractInteractionConfirmState = (
  args: RootState = { metamask: {} },
) => ({
  ...mockState,
  ...args,
  metamask: {
    ...mockState.metamask,
    preferences: {
      redesignedTransactionsEnabled: true,
      redesignedConfirmationsEnabled: true,
      isRedesignedConfirmationsDeveloperEnabled: true,
    },
    pendingApprovals: {
      '123': {
        id: '123',
        type: ApprovalType.Transaction,
      },
    },
    transactions: [
      {
        id: '123',
        type: TransactionType.contractInteraction,
        chainId: CHAIN_IDS.GOERLI,
        status: TransactionStatus.unapproved,
        txParams: { from: Object.keys(mockState.metamask.identities)[0] },
      },
    ],
    ...args.metamask,
  },
});

export const getMockConfirmState = (args: RootState = { metamask: {} }) => ({
  ...mockState,
  ...args,
  metamask: {
    ...mockState.metamask,
    preferences: {
      redesignedTransactionsEnabled: true,
      redesignedConfirmationsEnabled: true,
      isRedesignedConfirmationsDeveloperEnabled: true,
    },
    ...args.metamask,
  },
});
