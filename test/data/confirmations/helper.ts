import { ApprovalType } from '@metamask/controller-utils';

import { Confirmation } from '../../../ui/pages/confirmations/types/confirm';
import mockState from '../mock-state.json';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  genUnapprovedApproveConfirmation,
  genUnapprovedContractInteractionConfirmation,
} from './contract-interaction';
import { unapprovedPersonalSignMsg } from './personal_sign';
import { unapprovedTypedSignMsgV4 } from './typed_sign';

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
    ...args.metamask,
    preferences: {
      ...mockState.metamask.preferences,
      redesignedTransactionsEnabled: true,
      redesignedConfirmationsEnabled: true,
      isRedesignedConfirmationsDeveloperEnabled: true,
    },
    pendingApprovals: {
      [unapprovedTypedSignMsgV4.id]: {
        id: unapprovedTypedSignMsgV4.id,
        type: ApprovalType.EthSignTypedData,
      },
    },
    unapprovedTypedMessages: {
      [unapprovedTypedSignMsgV4.id]: unapprovedTypedSignMsgV4,
    },
  },
});

export const getMockPersonalSignConfirmState = (
  args: RootState = { metamask: {} },
) => ({
  ...mockState,
  ...args,
  metamask: {
    ...mockState.metamask,
    ...args.metamask,
    preferences: {
      ...mockState.metamask.preferences,
      redesignedTransactionsEnabled: true,
      redesignedConfirmationsEnabled: true,
      isRedesignedConfirmationsDeveloperEnabled: true,
    },
    pendingApprovals: {
      [unapprovedPersonalSignMsg.id]: {
        id: unapprovedPersonalSignMsg.id,
        type: ApprovalType.PersonalSign,
      },
    },
    unapprovedPersonalMsgs: {
      [unapprovedPersonalSignMsg.id]: unapprovedPersonalSignMsg,
    },
  },
});

export const getMockConfirmState = (args: RootState = { metamask: {} }) => ({
  ...mockState,
  ...args,
  metamask: {
    ...mockState.metamask,
    ...args.metamask,
    preferences: {
      ...mockState.metamask.preferences,
      redesignedTransactionsEnabled: true,
      redesignedConfirmationsEnabled: true,
      isRedesignedConfirmationsDeveloperEnabled: true,
    },
  },
});

export const getMockConfirmStateForTransaction = (
  transaction: Confirmation,
  args: RootState = { metamask: {} },
) =>
  getMockConfirmState({
    ...args,
    metamask: {
      ...args.metamask,
      pendingApprovals: {
        [transaction.id]: {
          id: transaction.id,
          type: ApprovalType.Transaction,
        },
      },
      transactions: [transaction],
    },
    confirm: {
      currentConfirmation: transaction,
    },
  });

export const getMockContractInteractionConfirmState = () => {
  const contractInteraction = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.GOERLI
  });
  return getMockConfirmStateForTransaction(contractInteraction);
};

export const getMockApproveConfirmState = () => {
  return getMockConfirmStateForTransaction(genUnapprovedApproveConfirmation());
};
