import {
  EthAccountType,
  EthMethod,
  BtcMethod,
  BtcAccountType,
  InternalAccount,
} from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { v4 as uuidv4 } from 'uuid';
import { keyringTypeToName } from '@metamask/accounts-controller';
import {
  DraftTransaction,
  draftTransactionInitialState,
  initialState,
} from '../../ui/ducks/send';
import { MetaMaskReduxState } from '../../ui/store/store';

export const MOCK_DEFAULT_ADDRESS =
  '0xd5e099c71b797516c10ed0f0d895f429c2781111';

export const TOP_ASSETS_GET_RESPONSE = [
  {
    symbol: 'LINK',
    address: '0x514910771af9ca656af840dff83e8264ecf986ca',
  },
  {
    symbol: 'UMA',
    address: '0x04fa0d235c4abf4bcf4787af4cf447de572ef828',
  },
  {
    symbol: 'YFI',
    address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
  },
  {
    symbol: 'LEND',
    address: '0x80fb784b7ed66730e8b1dbd9820afd29931aab03',
  },
  {
    symbol: 'SNX',
    address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  },
];

export const REFRESH_TIME_GET_RESPONSE = {
  seconds: 3600,
};

export const AGGREGATOR_METADATA_GET_RESPONSE = {};

export const GAS_PRICES_GET_RESPONSE = {
  SafeGasPrice: '10',
  ProposeGasPrice: '20',
  FastGasPrice: '30',
};

export const TOKENS_GET_RESPONSE = [
  {
    erc20: true,
    symbol: 'META',
    decimals: 18,
    address: '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4',
  },
  {
    erc20: true,
    symbol: 'ZRX',
    decimals: 18,
    address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
  },
  {
    erc20: true,
    symbol: 'AST',
    decimals: 4,
    address: '0x27054b13b1B798B345b591a4d22e6562d47eA75a',
  },
  {
    erc20: true,
    symbol: 'BAT',
    decimals: 18,
    address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
  },
];

export const createFeatureFlagsResponse = () => {
  return {
    bsc: {
      mobileActive: false,
      extensionActive: true,
      fallbackToV1: true,
    },
    ethereum: {
      mobileActive: false,
      extensionActive: true,
      fallbackToV1: true,
    },
    polygon: {
      mobileActive: false,
      extensionActive: true,
      fallbackToV1: false,
    },
  };
};

export const createGasFeeEstimatesForFeeMarket = () => {
  return {
    low: {
      minWaitTimeEstimate: 180000,
      maxWaitTimeEstimate: 300000,
      suggestedMaxPriorityFeePerGas: '3',
      suggestedMaxFeePerGas: '53',
    },
    medium: {
      minWaitTimeEstimate: 15000,
      maxWaitTimeEstimate: 60000,
      suggestedMaxPriorityFeePerGas: '7',
      suggestedMaxFeePerGas: '70',
    },
    high: {
      minWaitTimeEstimate: 0,
      maxWaitTimeEstimate: 15000,
      suggestedMaxPriorityFeePerGas: '10',
      suggestedMaxFeePerGas: '100',
    },
    estimatedBaseFee: '50',
  };
};

export const INITIAL_SEND_STATE_FOR_EXISTING_DRAFT = {
  ...initialState,
  currentTransactionUUID: 'test-uuid',
  draftTransactions: {
    'test-uuid': {
      ...draftTransactionInitialState,
    },
  },
};

export const getInitialSendStateWithExistingTxState = (
  draftTxState: DraftTransaction & { test: string },
) => ({
  ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
  draftTransactions: {
    'test-uuid': {
      ...draftTransactionInitialState,
      ...draftTxState,
      amount: {
        ...draftTransactionInitialState.amount,
        ...draftTxState.amount,
      },
      sendAsset: {
        ...draftTransactionInitialState.sendAsset,
        ...draftTxState.sendAsset,
      },
      gas: {
        ...draftTransactionInitialState.gas,
        ...draftTxState.gas,
      },
      isSwapQuoteLoading: false,
      quotes: draftTxState.quotes ?? null,
      receiveAsset: {
        ...draftTransactionInitialState.receiveAsset,
        ...(draftTxState.receiveAsset ?? draftTxState.sendAsset),
      },
      swapQuotesError: null,
      swapQuotesLatestRequestTimestamp: null,
      timeToFetchQuotes: null,
      recipient: {
        ...draftTransactionInitialState.recipient,
        ...draftTxState.recipient,
      },
      history: draftTxState.history ?? [],
      userInputHexData: draftTxState.userInputHexData ?? null,
      // Use this key if you want to console.log inside the send.js file.
      test: draftTxState.test ?? 'yo',
    },
  },
});

export function createMockInternalAccount({
  name = 'Account 1',
  address = MOCK_DEFAULT_ADDRESS,
  type = EthAccountType.Eoa,
  keyringType = KeyringTypes.hd,
  lastSelected = 0,
  snapOptions = undefined,
}: {
  name?: string;
  address?: string;
  type?: string;
  keyringType?: string;
  lastSelected?: number;
  snapOptions?: {
    enabled: boolean;
    name: string;
    id: string;
  };
} = {}) {
  let methods;

  switch (type) {
    case EthAccountType.Eoa:
      methods = [
        EthMethod.PersonalSign,
        EthMethod.SignTransaction,
        EthMethod.SignTypedDataV1,
        EthMethod.SignTypedDataV3,
        EthMethod.SignTypedDataV4,
      ];
      break;
    case EthAccountType.Erc4337:
      methods = [
        EthMethod.PatchUserOperation,
        EthMethod.PrepareUserOperation,
        EthMethod.SignUserOperation,
      ];
      break;
    case BtcAccountType.P2wpkh:
      methods = [BtcMethod.SendMany];
      break;
    default:
      throw new Error(`Unknown account type: ${type}`);
  }

  return {
    address,
    id: uuidv4(),
    metadata: {
      name: name ?? `${keyringTypeToName(keyringType)} 1`,
      importTime: Date.now(),
      keyring: {
        type: keyringType,
      },
      snap: snapOptions,
      lastSelected,
    },
    options: {},
    methods,
    type,
  };
}

export const getSelectedInternalAccountFromMockState = (
  state: MetaMaskReduxState,
): InternalAccount => {
  return state.metamask.internalAccounts.accounts[
    state.metamask.internalAccounts.selectedAccount
  ];
};
