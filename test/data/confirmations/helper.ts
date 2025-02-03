import { ApprovalType } from '@metamask/controller-utils';
import { merge } from 'lodash';

import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  Confirmation,
  SignatureRequestType,
} from '../../../ui/pages/confirmations/types/confirm';
import mockState from '../mock-state.json';
import { genUnapprovedContractInteractionConfirmation } from './contract-interaction';
import { unapprovedPersonalSignMsg } from './personal_sign';
import { genUnapprovedSetApprovalForAllConfirmation } from './set-approval-for-all';
import { genUnapprovedApproveConfirmation } from './token-approve';
import { genUnapprovedTokenTransferConfirmation } from './token-transfer';
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

export const getMockTypedSignConfirmStateForRequest = (
  signature: SignatureRequestType,
  args: RootState = { metamask: {} },
) => ({
  ...mockState,
  ...args,
  metamask: {
    ...mockState.metamask,
    ...args.metamask,
    preferences: {
      ...mockState.metamask.preferences,
    },
    pendingApprovals: {
      [signature.id]: {
        id: signature.id,
        type: ApprovalType.EthSignTypedData,
      },
    },
    unapprovedTypedMessages: {
      [signature.id]: signature,
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

export const getMockPersonalSignConfirmStateForRequest = (
  signature: SignatureRequestType,
  args: RootState = { metamask: {} },
) => ({
  ...mockState,
  ...args,
  metamask: {
    ...mockState.metamask,
    ...args.metamask,
    preferences: {
      ...mockState.metamask.preferences,
    },
    pendingApprovals: {
      [signature.id]: {
        id: signature.id,
        type: ApprovalType.PersonalSign,
      },
    },
    unapprovedPersonalMsgs: {
      [signature.id]: signature,
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
      ...(args.metamask?.preferences as Record<string, unknown>),
    },
  },
});

export const getMockConfirmStateForTransaction = (
  transaction: Confirmation,
  args: RootState = { metamask: {} },
) =>
  getMockConfirmState(
    merge(
      {
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
      },
      args,
    ),
  );

export const getMockContractInteractionConfirmState = (
  args: RootState = { metamask: {} },
) => {
  const contractInteraction = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.GOERLI,
  });
  return getMockConfirmStateForTransaction(contractInteraction, args);
};

export const getMockApproveConfirmState = () => {
  return getMockConfirmStateForTransaction(
    genUnapprovedApproveConfirmation({ chainId: '0x5' }),
  );
};

export const getMockSetApprovalForAllConfirmState = () => {
  return getMockConfirmStateForTransaction(
    genUnapprovedSetApprovalForAllConfirmation({ chainId: '0x5' }),
  );
};

export const getMockTokenTransferConfirmState = ({
  isWalletInitiatedConfirmation = false,
}: {
  isWalletInitiatedConfirmation?: boolean;
}) => {
  return getMockConfirmStateForTransaction(
    genUnapprovedTokenTransferConfirmation({
      chainId: '0x5',
      isWalletInitiatedConfirmation,
    }),
  );
};
