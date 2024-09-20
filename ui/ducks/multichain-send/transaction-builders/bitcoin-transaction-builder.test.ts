import {
  BtcAccountType,
  BtcMethod,
  KeyringRpcMethod,
} from '@metamask/keyring-api';
import { Dispatch, AnyAction } from 'redux';
import { GetThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';
import { BigNumber } from 'bignumber.js';
import { HandlerType } from '@metamask/snaps-utils';
import { CaipChainId } from '@metamask/utils';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import mockMultichainSendState from '../../../../test/data/mock-multichain-send-state-with-empty-draft.json';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  FeeLevel,
  initialMultichainDraftTransaction,
  MultichainSendState,
} from '../multichain-send';
import { BITCOIN_WALLET_SNAP_ID } from '../../../../app/scripts/lib/snap-keyring/bitcoin-wallet-snap';
import { INVALID_RECIPIENT_ADDRESS_ERROR } from '../../../pages/confirmations/send/send.constants';
import { AssetType } from '../../../../shared/constants/transaction';
import { MultichainNativeAssets } from '../../../../shared/constants/multichain/assets';
import { BitcoinTransactionBuilder } from './bitcoin-transaction-builder';

const mockDispatch = jest.fn();
const mockGetState = jest.fn();

const mockThunkApi: GetThunkAPI<{
  state: { multichainSend: MultichainSendState };
  dispatch: Dispatch<AnyAction>;
}> = {
  dispatch: mockDispatch,
  getState: mockGetState,
  extra: {},
  requestId: '',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signal: {} as any,
  rejectWithValue: jest.fn(),
  fulfillWithValue: jest.fn(),
  abort(_reason?: string): void {
    throw new Error('Function not implemented.');
  },
};

const mockHandleSnapRequest = jest.fn();

jest.mock('../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../store/actions.ts'),
  handleSnapRequest: (request: unknown) => mockHandleSnapRequest(request),
}));

const mockBtcAccount = createMockInternalAccount({
  name: 'Btc Account',
  address: 'bc1qa4muxuheal3suc3hyn9d8k45urqsc4tj2n7c6x',
  type: BtcAccountType.P2wpkh,
});

const mockTransactionParams =
  initialMultichainDraftTransaction.transactionParams;

const btcToSats = (amount: string): string => {
  return new BigNumber(amount).mul(new BigNumber(10).pow(8)).toString();
};

const createBuilder = (transactionParams = mockTransactionParams) => {
  const builder = new BitcoinTransactionBuilder(
    mockThunkApi,
    mockBtcAccount,
    MultichainNetworks.BITCOIN,
    transactionParams,
  );
  return builder;
};

describe('BitcoinTransactionBuilder', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('signTransaction', () => {
    it('throws error if the transaction is not valid', async () => {
      const builder = createBuilder({
        ...mockTransactionParams,
        recipient: {
          address: '',
          valid: false,
          error: '',
        },
        sendAsset: {
          ...mockTransactionParams.sendAsset,
          amount: '',
          valid: false,
          error: '',
        },
      });
      await expect(() => builder.signTransaction()).rejects.toThrow(
        'Invalid recipient',
      );
    });

    it('calls `sendmany` to the bitcoin snap', async () => {
      const mockSignedTransaction = 'signedTransaction';
      mockHandleSnapRequest.mockResolvedValue({
        result: {
          txId: mockSignedTransaction,
        },
      });

      const builder = createBuilder();
      builder.setAmount('1');
      builder.setRecipient(mockBtcAccount.address);
      builder.buildTransaction();
      const signature = await builder.signTransaction();
      const transactionParams = builder.getTransactionParams();

      expect(mockHandleSnapRequest).toHaveBeenCalledWith({
        snapId: BITCOIN_WALLET_SNAP_ID,
        origin: 'metamask',
        handler: HandlerType.OnKeyringRequest,
        request: {
          method: KeyringRpcMethod.SubmitRequest,
          params: {
            id: expect.any(String),
            account: mockBtcAccount.id,
            scope: transactionParams.network.network,
            request: {
              method: BtcMethod.SendMany,
              params: builder.transaction,
            },
          },
        },
      });

      expect(signature).toBe(mockSignedTransaction);
    });
  });

  describe('sendTransaction', () => {
    it('just returns the signed transaction', async () => {
      const builder = createBuilder();
      const signedTransaction = 'signedTransaction';

      const result = await builder.sendTransaction(signedTransaction);
      expect(result).toBe(signedTransaction);
    });
  });

  describe('setAmount', () => {
    it('should set the amount correctly', () => {
      const builder = createBuilder();
      const amount = '0.01';
      const result = builder.setAmount(amount);

      expect(result.amount).toEqual(amount);
    });
  });

  describe('buildTransaction', () => {
    it('should build the transaction correctly', async () => {
      const mockEstimatedFeeResponse = {
        fee: { amount: '0.005', unit: 'btc' },
      };
      mockHandleSnapRequest.mockResolvedValue(mockEstimatedFeeResponse);
      const mockSendAmount = '100000000';
      const expectedSendManyTransaction = {
        amounts: {
          [mockBtcAccount.address]: new BigNumber(mockSendAmount)
            .div(new BigNumber(10).pow(8))
            .toString(),
        },
        comment: '',
        subtractFeeFrom: [],
        replaceable: true,
        dryrun: false,
      };

      const builder = createBuilder();
      builder.setAmount(mockSendAmount);
      builder.setRecipient(mockBtcAccount.address);
      await builder.estimateGas();

      builder.buildTransaction();

      expect(builder.transaction).toStrictEqual(expectedSendManyTransaction);
    });

    it('throws error if the amount is not set', () => {
      const builder = createBuilder({
        ...mockTransactionParams,
        sendAsset: {
          amount: '',
          assetDetails: {
            type: AssetType.native,
            // @ts-expect-error TODO: create placeholder
            image: './images/placeholder.svg',
            symbol: '',
            balance: '0',
            details: {
              decimals: 8,
            },
          },
          asset: '',
          denominatinon: undefined,
          valid: false,
          error: '',
        },
      });

      builder.setRecipient(mockBtcAccount.address);

      expect(() => builder.buildTransaction()).toThrow('Invalid amount');
    });

    it('throws error if the recipient is not set', () => {
      const builder = createBuilder({
        ...mockTransactionParams,
        recipient: {
          address: '',
          valid: false,
          error: '',
        },
      });

      expect(() => builder.buildTransaction()).toThrow('Invalid recipient');
    });

    it('throws error if the fee is not set', () => {
      const builder = createBuilder({
        ...mockTransactionParams,
        fee: {
          ...mockTransactionParams.fee,
          fee: '',
          unit: 'sats',
          error: '',
        },
      });

      builder.setAmount('100000000');
      builder.setRecipient(mockBtcAccount.address);
      expect(() => builder.buildTransaction()).toThrow('Invalid fee');
    });
  });

  describe('estimateGas', () => {
    it('calls `estimateFee` to the bitcoin snap', async () => {
      const mockEstimatedFeeResponse = {
        fee: { amount: '0.005', unit: 'btc' },
      };
      mockHandleSnapRequest.mockResolvedValue(mockEstimatedFeeResponse);

      const expectedResponse = {
        fee: btcToSats(mockEstimatedFeeResponse.fee.amount),
        unit: 'sats',
        error: '',
        confirmationTime: '10 minutes',
      };

      const builder = createBuilder();
      const transactionParams = builder.getTransactionParams();
      const estimatedGas = await builder.estimateGas();
      expect(mockHandleSnapRequest).toHaveBeenCalledWith({
        snapId: BITCOIN_WALLET_SNAP_ID,
        origin: 'metamask',
        handler: HandlerType.OnRpcRequest,
        request: {
          method: 'estimateFee',
          params: {
            account: mockBtcAccount.id,
            amount: transactionParams.sendAsset.amount,
          },
        },
      });
      expect(estimatedGas).toStrictEqual(expectedResponse);
    });

    it('throws error if the amount is not set', async () => {
      const builder = createBuilder({
        ...mockTransactionParams,
        sendAsset: {
          amount: '',
          assetDetails: {
            type: AssetType.native,
            // @ts-expect-error TODO: create placeholder
            image: './images/placeholder.svg',
            symbol: '',
            balance: '0',
            details: {
              decimals: 8,
            },
          },
          asset: '',
          denominatinon: undefined,
          valid: false,
          error: '',
        },
      });
      const estimatedGas = await builder.estimateGas();
      expect(estimatedGas.error).toBe('Amount is required');
    });
  });

  describe('queryAssetBalance', () => {
    it('retrieves cached balance', async () => {
      const mockedCachedBalance = {
        amount: '0.01',
        unit: 'BTC',
      };
      mockGetState.mockReturnValue({
        ...mockMultichainSendState,
        metamask: {
          ...mockMultichainSendState.metamask,
          internalAccounts: {
            accounts: {
              [mockBtcAccount.id]: mockBtcAccount,
            },
            selectedAccount: mockBtcAccount.id,
          },
          balances: {
            [mockBtcAccount.id]: {
              [MultichainNativeAssets.BITCOIN]: {
                amount: '0.01',
                unit: 'btc',
              },
            },
          },
        },
      });
      const builder = createBuilder();
      builder.queryAssetBalance();

      const result = await builder.queryAssetBalance();
      expect(result).toStrictEqual(mockedCachedBalance);
    });
  });

  describe('validateTransaction', () => {
    it('validates the transaction correctly', async () => {
      const mockGasResponse = {
        fee: { amount: '0.005', unit: 'btc' },
        balance: {
          amount: '0.01',
          unit: 'btc',
        },
      };
      mockHandleSnapRequest.mockResolvedValue(mockGasResponse);

      const builder = createBuilder();
      builder.setAmount('100000000');
      builder.setRecipient(mockBtcAccount.address);
      await builder.estimateGas();
      builder.buildTransaction();

      const result = builder.validateTransaction();
      expect(result).toBe(true);
      expect(builder.transaction).toStrictEqual({
        amounts: {
          [mockBtcAccount.address]: '1',
        },
        comment: '',
        subtractFeeFrom: [],
        replaceable: true,
        dryrun: false,
      });
    });
  });

  describe('setSendAsset', () => {
    it('sets only native btc as the send asset', () => {
      const builder = createBuilder();
      const result = builder.setSendAsset(MultichainNativeAssets.BITCOIN);
      expect(result.asset).toBe(MultichainNativeAssets.BITCOIN);
      expect(result.valid).toBe(true);
      expect(result.error).toBe('');
    });

    it('returns error if the asset is not supported', () => {
      const mockAsset = 'mock asset';
      const builder = createBuilder();
      const result = builder.setSendAsset(mockAsset);
      expect(result.asset).toBe('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(`Invalid asset: ${mockAsset}`);
    });
  });

  describe('setRecipient', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      {
        address: 'bc1qa4muxuheal3suc3hyn9d8k45urqsc4tj2n7c6x',
        network: MultichainNetworks.BITCOIN,
        error: '',
      },
      {
        address: 'tb1qgaetv8fl5fs99jjyfamkxuvsly5fhq3dpkvmh5',
        network: MultichainNetworks.BITCOIN_TESTNET,
        error: '',
      },
      {
        address: 'bc1qa4muxuheal3suc3hyn9d8k45urqsc4tj2n7c6x',
        network: MultichainNetworks.BITCOIN_TESTNET,
        error: INVALID_RECIPIENT_ADDRESS_ERROR,
      },
      {
        address: 'tb1qgaetv8fl5fs99jjyfamkxuvsly5fhq3dpkvmh5',
        network: MultichainNetworks.BITCOIN,
        error: INVALID_RECIPIENT_ADDRESS_ERROR,
      },
      {
        address: 'invalid-url',
        network: MultichainNetworks.BITCOIN,
        error: INVALID_RECIPIENT_ADDRESS_ERROR,
      },
      {
        address: 'invalid-url',
        network: MultichainNetworks.BITCOIN_TESTNET,
        error: INVALID_RECIPIENT_ADDRESS_ERROR,
      },
    ])(
      `handles the recipient address, $address, with the network $network correctly`,
      ({
        address,
        network,
        error,
      }: {
        address: string;
        network: CaipChainId;
        error: string;
      }) => {
        const builder = createBuilder();
        builder.setNetwork(network);
        const result = builder.setRecipient(address);
        expect(result).toStrictEqual({
          address,
          valid: error === '',
          error,
        });
      },
    );
  });

  describe('setFee', () => {
    it('sets the fee correctly', async () => {
      const mockEstimatedFeeResponse = {
        fee: { amount: '0.005', unit: 'btc' },
      };
      mockHandleSnapRequest.mockResolvedValue(mockEstimatedFeeResponse);

      const builder = createBuilder();
      const result = await builder.setFee(FeeLevel.Average);

      expect(result).toStrictEqual({
        fee: btcToSats(mockEstimatedFeeResponse.fee.amount),
        unit: 'btc',
        error: '',
        feeLevel: FeeLevel.Average,
        valid: true,
        confirmationTime: '10 minutes',
        feeInFiat: expect.any(String),
        isLoading: false,
      });
    });
  });

  describe('setNetwork', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([MultichainNetworks.BITCOIN, MultichainNetworks.BITCOIN_TESTNET])(
      'it sets the network $1 correctly',
      (network: CaipChainId) => {
        const builder = createBuilder();
        const result = builder.setNetwork(network);
        expect(result).toStrictEqual({
          network,
          error: '',
        });
      },
    );

    it('returns error if the network is not supported', () => {
      const mockUnsupportedNetwork = 'unsupported';
      const builder = createBuilder();
      // @ts-expect-error mock network
      const result = builder.setNetwork(mockUnsupportedNetwork);
      expect(result.error).toStrictEqual(
        `Invalid network: ${mockUnsupportedNetwork}`,
      );
    });
  });

  describe('setMaxSendAmount', () => {
    it('sends `getMaxSpendableBalance to the bitcoin snap', async () => {
      const builder = createBuilder();
      const mockResponse = {
        fee: { amount: '0.005', unit: 'btc' },
        balance: {
          amount: '0.01',
          unit: 'btc',
        },
      };
      const expectedAmount = btcToSats(mockResponse.balance.amount);
      const expectedFee = btcToSats(mockResponse.fee.amount);

      mockHandleSnapRequest.mockResolvedValue(mockResponse);

      const maxAmounInSats = await builder.setMaxSendAmount();
      const transactionParams = builder.getTransactionParams();

      expect(mockHandleSnapRequest).toHaveBeenCalledWith({
        snapId: BITCOIN_WALLET_SNAP_ID,
        origin: 'metamask',
        handler: HandlerType.OnRpcRequest,
        request: {
          method: 'getMaxSpendableBalance',
          params: {
            account: mockBtcAccount.id,
          },
        },
      });
      expect(maxAmounInSats).toEqual(expectedAmount);
      expect(transactionParams.fee.fee).toBe(expectedFee);
      expect(transactionParams.sendAsset.amount).toBe(expectedAmount);
    });
  });
});
