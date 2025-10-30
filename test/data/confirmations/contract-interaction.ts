import {
  AuthorizationList,
  BatchTransactionParams,
  CHAIN_IDS,
  GasFeeToken,
  SimulationData,
  TransactionContainerType,
  TransactionMeta,
  TransactionParams,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  Confirmation,
  SignatureRequestType,
} from '../../../ui/pages/confirmations/types/confirm';

export const PAYMASTER_AND_DATA =
  '0x9d6ac51b972544251fcc0f2902e633e3f9bd3f2900000000000000000000000000000000000000000000000000000000666bfd410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003498a76eb88b702e5e52b00fbc16a36baf89ebe3e0dd23170949cffc0a623011383cced660ff67930308c22e5aa746a2d586629ddbd87046a146225bf80e9d6f1b';

export const CONTRACT_INTERACTION_SENDER_ADDRESS =
  '0x2e0d7e8c45221fca00d74a3609a0f7097035d09b';

export const DEPOSIT_METHOD_DATA = '0xd0e30db0';

export const CHAIN_ID = CHAIN_IDS.GOERLI;

export const genUnapprovedContractInteractionConfirmation = ({
  address = CONTRACT_INTERACTION_SENDER_ADDRESS,
  authorizationList = undefined,
  containerTypes = undefined,
  delegationAddress = undefined,
  origin,
  txData = DEPOSIT_METHOD_DATA,
  chainId = CHAIN_ID,
  nestedTransactions,
  simulationData,
  gasFeeTokens,
  selectedGasFeeToken,
  txParamsOriginal,
}: {
  address?: Hex;
  authorizationList?: AuthorizationList;
  containerTypes?: TransactionContainerType[];
  delegationAddress?: Hex;
  origin?: string;
  txData?: Hex;
  chainId?: string;
  nestedTransactions?: BatchTransactionParams[];
  gasFeeTokens?: GasFeeToken[];
  selectedGasFeeToken?: Hex;
  simulationData?: SimulationData;
  txParamsOriginal?: TransactionParams;
} = {}): Confirmation => {
  const confirmation: Confirmation = {
    actionId: String(400855682),
    chainId,
    containerTypes,
    dappSuggestedGasFees: {
      gas: '0xab77',
    },
    defaultGasEstimates: {
      estimateType: 'medium',
      gas: '0xab77',
      maxFeePerGas: '0xaa350353',
      maxPriorityFeePerGas: '0x59682f00',
    },
    delegationAddress,
    gasFeeEstimatesLoaded: true,
    gasFeeTokens,
    history: [
      {
        actionId: String(400855682),
        chainId,
        dappSuggestedGasFees: {
          gas: '0xab77',
        },
        defaultGasEstimates: {
          estimateType: 'medium',
          gas: '0xab77',
          maxFeePerGas: '0xaa350353',
          maxPriorityFeePerGas: '0x59682f00',
        },
        id: '1d7c08c0-fe54-11ee-9243-91b1e533746a',
        origin: 'https://metamask.github.io',
        securityAlertResponse: {
          reason: 'loading',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: 'validation_in_progress',
        },
        sendFlowHistory: [],
        status: TransactionStatus.unapproved,
        time: 1713534772044,
        txParams: {
          authorizationList,
          data: txData,
          from: address,
          gas: '0xab77',
          maxFeePerGas: '0xaa350353',
          maxPriorityFeePerGas: '0x59682f00',
          to: '0x88aa6343307ec9a652ccddda3646e62b2f1a5125',
          value: '0x3782dace9d900000',
        },
        type: TransactionType.contractInteraction,
        userEditedGasLimit: false,
        userFeeLevel: 'medium',
        verifiedOnBlockchain: false,
      },
      [
        {
          note: 'TransactionController#updateSimulationData - Update simulation data',
          op: 'add',
          path: '/simulationData',
          timestamp: 1713534772417,
          value: {
            nativeBalanceChange: {
              difference: '0x3782dace9d900000',
              isDecrease: true,
              newBalance: '0xcc0ea4fb7ffa87d',
              previousBalance: '0x4443c51e558fa87d',
            },
            tokenBalanceChanges: [],
          },
        },
        {
          op: 'add',
          path: '/gasFeeEstimatesLoaded',
          value: true,
        },
      ],
      [
        {
          note: 'TransactionController:updatesecurityAlertResponse - securityAlertResponse updated',
          op: 'replace',
          path: '/securityAlertResponse/result_type',
          timestamp: 1713534773213,
          value: 'Benign',
        },
        {
          op: 'replace',
          path: '/securityAlertResponse/reason',
          value: '',
        },
        {
          op: 'add',
          path: '/securityAlertResponse/description',
          value: '',
        },
        {
          op: 'add',
          path: '/securityAlertResponse/features',
          value: [],
        },
        {
          op: 'add',
          path: '/securityAlertResponse/block',
          value: 5732063,
        },
      ],
    ],
    id: '1d7c08c0-fe54-11ee-9243-91b1e533746a',
    nestedTransactions,
    origin: origin ?? 'https://metamask.github.io',
    securityAlertResponse: {
      features: [],
      reason: '',
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: 'Benign',
    },
    selectedGasFeeToken,
    sendFlowHistory: [],
    simulationData: {
      nativeBalanceChange: {
        difference: '0x3782dace9d900000',
        isDecrease: true,
        newBalance: '0xcc0ea4fb7ffa87d',
        previousBalance: '0x4443c51e558fa87d',
      },
      tokenBalanceChanges: [],
    },
    status: TransactionStatus.unapproved,
    time: 1713534772044,
    txParams: {
      authorizationList,
      data: txData,
      from: address,
      gas: '0xab77',
      maxFeePerGas: '0xaa350353',
      maxPriorityFeePerGas: '0x59682f00',
      to: '0x88aa6343307ec9a652ccddda3646e62b2f1a5125',
      value: '0x3782dace9d900000',
    },
    gasLimitNoBuffer: '0xab77',
    txParamsOriginal,
    type: TransactionType.contractInteraction,
    userEditedGasLimit: false,
    userFeeLevel: 'medium',
    verifiedOnBlockchain: false,
  } as SignatureRequestType;

  // Overwrite simulation data if provided
  if (simulationData) {
    (confirmation as TransactionMeta).simulationData = simulationData;
  }

  return confirmation;
};

export const mockSwapConfirmation = {
  chainId: '0x2105',
  id: 'f8172040-b3d0-11f0-a882-3f99aa2e9f0c',
  networkClientId: 'base-mainnet',
  origin: 'https://app.uniswap.org',
  status: 'unapproved',
  time: 1761637054532,
  txParams: {
    from: '0x5206d14bfa10bd18989038fe628a79a135f2ee2f',
    data: '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000690079c500000000000000000000000000000000000000000000000000000000000000040a1006040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000006c000000000000000000000000000000000000000000000000000000000000007400000000000000000000000000000000000000000000000000000000000000160000000000000000000000000fdcc3dd6671eab0709a4c0f3f53de9a333d80798000000000000000000000000ffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000006927ffb600000000000000000000000000000000000000000000000000000000000000000000000000000000000000006ff5693b99212da76ad316178a184ab56d299b4300000000000000000000000000000000000000000000000000000000690079be00000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000419ee2d2915f362d58570a6df9710059ca304ea4ac41b784318725ec10e1031b9c0abee201a1955c8995410423c5d2bde8ee9a2ef1b3b2deb7e21e721a48d3eab51c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004a0000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000003070b0e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000038000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000020000000000000000000000000fdcc3dd6671eab0709a4c0f3f53de9a333d8079800000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000100000000000000000000000000cc18b41a0f63c67f17f23388c848aec67b58342200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda0291300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000fdcc3dd6671eab0709a4c0f3f53de9a333d80798000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000060000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda029130000000000000000000000007ffc3dbf3b2b50ff3a1d5523bc24bb5043837b1400000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000060000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda029130000000000000000000000005206d14bfa10bd18989038fe628a79a135f2ee2f00000000000000000000000000000000000000000000000000000000000ed8440c',
    gas: '0x58e25',
    to: '0x6ff5693b99212da76ad316178a184ab56d299b43',
    value: '0x0',
    maxFeePerGas: '0x9210fa',
    maxPriorityFeePerGas: '0x9210fa',
    type: '0x2',
  },
  type: 'contractInteraction',
  gasLimitNoBuffer: '0x58e25',
  layer1GasFee: '0x61077a1f',
  sendFlowHistory: [],
  gasUsed: '0x4674f',
  simulationData: {
    tokenBalanceChanges: [
      {
        address: '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798',
        standard: 'erc20',
        previousBalance: '0xde0b6b3a7640000',
        newBalance: '0x0',
        difference: '0xde0b6b3a7640000',
        isDecrease: true,
      },
      {
        address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        standard: 'erc20',
        previousBalance: '0x186a0',
        newBalance: '0x10bde7',
        difference: '0xf3747',
        isDecrease: false,
      },
    ],
  },
};
