import { ApprovalType } from '@metamask/controller-utils';
import { merge } from 'lodash';

import { DecodedPermission } from '@metamask/gator-permissions-controller';
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
import {
  unapprovedTypedSignMsgV4,
  unapprovedTypedSignMsgV4WithPermission,
} from './typed_sign';

type RootState = { metamask: Record<string, unknown> } & Record<
  string,
  unknown
>;

/** Selected EVM account UUID from `test/data/mock-state.json`. */
export const MOCK_CONFIRMATIONS_ACCOUNT_ID =
  'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';

/**
 * Convert a wei hex string or integer into the human-readable decimal amount
 * string stored in unified `assetsBalance`.
 * @param wei
 * @param decimals
 */
export function weiToAssetAmount(wei: string | number, decimals = 18): string {
  const value = typeof wei === 'string' ? BigInt(wei) : BigInt(wei);
  if (value === 0n) {
    return '0';
  }
  const padded = value.toString().padStart(decimals + 1, '0');
  const whole = padded.slice(0, -decimals).replace(/^0+/u, '') || '0';
  const frac = padded.slice(-decimals).replace(/0+$/u, '');
  return frac ? `${whole}.${frac}` : whole;
}

/**
 * CAIP-19 asset id for the native ETH-like asset on an EVM chain.
 * @param hexChainId
 */
export function nativeEvmAssetId(hexChainId: string): string {
  return `eip155:${Number.parseInt(hexChainId, 16)}/slip44:60`;
}

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

export const getMockTypedSignPermissionConfirmState = (
  permission:
    | DecodedPermission
    | undefined = unapprovedTypedSignMsgV4WithPermission.decodedPermission,
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
      [unapprovedTypedSignMsgV4.id]: {
        ...unapprovedTypedSignMsgV4WithPermission,
        decodedPermission: permission,
      },
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
        origin: 'https://metamask.github.io',
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
  args: RootState = { appState: {}, metamask: {} },
) =>
  getMockConfirmState(
    merge(
      {
        appState: args.appState,
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

export const addEthereumChainApproval = {
  id: 'j8GP9DVKMR8mz6I-DQM25',
  origin: 'https://chainid.network',
  type: 'wallet_addEthereumChain',
  time: 1760960363027,
  requestData: {
    chainId: '0x3af',
    rpcPrefs: {
      blockExplorerUrl: 'https://scan.v4.testnet.pulsechain.com',
    },
    chainName: 'PulseChain Testnet v4',
    rpcUrl: 'https://rpc.v4.testnet.pulsechain.com',
    ticker: 'tPLS',
  },
  requestState: null,
  expectsResult: false,
};

export const getMockAddEthereumChainConfirmState = () => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    pendingApprovals: {
      '1': {
        id: '1',
        type: ApprovalType.AddEthereumChain,
        requestData: {
          chainId: '0x5',
          chainName: 'Test Network',
          rpcUrl: 'https://rpc.example.com',
        },
        origin: 'https://example.com',
      },
    },
  },
});
