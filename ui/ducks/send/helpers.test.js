import { BigNumber } from '@ethersproject/bignumber';
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { GAS_LIMITS } from '../../../shared/constants/gas';
import {
  AssetType,
  TokenStandard,
} from '../../../shared/constants/transaction';
import { BURN_ADDRESS } from '../../../shared/modules/hexstring-utils';
import { getInitialSendStateWithExistingTxState } from '../../../test/jest/mocks';
import {
  generateERC1155TransferData,
  generateERC20TransferData,
  generateERC721TransferData,
} from '../../pages/confirmations/send/send.utils';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import {
  checkNetworkAndAccountSupports1559,
  getConfirmationExchangeRates,
  getTokenExchangeRates,
} from '../../selectors';
import { getGasFeeEstimates, getNativeCurrency } from '../metamask/metamask';
import { getUsedSwapsGasPrice } from '../swaps/swaps';
import { fetchTokenExchangeRates } from '../../helpers/utils/util';
import {
  addAdjustedReturnToQuotes,
  calculateBestQuote,
  getIsDraftSwapAndSend,
  generateTransactionParams,
} from './helpers';

jest.mock('human-standard-token-abi', () => ({}));

jest.mock('../../../shared/constants/gas', () => ({
  GAS_LIMITS: { BASE_TOKEN_ESTIMATE: '0x5208', SIMPLE: '0x5208' },
  MIN_GAS_LIMIT_HEX: '0x5208',
}));

jest.mock('../../../shared/constants/transaction', () => ({
  AssetType: { token: 'token', NFT: 'NFT', native: 'native' },
  TokenStandard: { ERC721: 'ERC721', ERC1155: 'ERC1155' },
}));

jest.mock('../../pages/confirmations/send/send.utils', () => ({
  addGasBuffer: jest.fn(),
  generateERC20TransferData: jest.fn(),
  generateERC721TransferData: jest.fn(),
  generateERC1155TransferData: jest.fn(),
  getAssetTransferData: jest.fn(),
}));

jest.mock('../../../shared/modules/selectors/networks', () => ({
  getCurrentChainId: jest.fn(),
  getNetworkConfigurationsByChainId: jest.fn(),
  getSelectedNetworkClientId: jest.fn(),
}));

jest.mock('../../selectors', () => ({
  checkNetworkAndAccountSupports1559: jest.fn(),
  getConfirmationExchangeRates: jest.fn(),
  getGasPriceInHexWei: jest.fn(),
  getTokenExchangeRates: jest.fn(),
}));

jest.mock('../../store/actions', () => ({
  estimateGas: jest.fn(),
}));

jest.mock('../metamask/metamask', () => ({
  ...jest.requireActual('../metamask/metamask'),
  getGasFeeEstimates: jest.fn(),
  getNativeCurrency: jest.fn(),
}));

jest.mock('../swaps/swaps', () => ({
  getUsedSwapsGasPrice: jest.fn(),
}));

jest.mock('../../helpers/utils/util', () => ({
  fetchTokenExchangeRates: jest.fn(),
}));

describe('Send Slice Helpers', () => {
  describe('generateTransactionParams', () => {
    it('should generate a txParams for a token transfer', () => {
      const tokenDetails = {
        address: '0xToken',
        symbol: 'SYMB',
        decimals: 18,
      };
      const txParams = generateTransactionParams(
        getInitialSendStateWithExistingTxState({
          fromAccount: {
            address: '0x00',
          },
          amount: {
            value: '0x1',
          },
          sendAsset: {
            type: AssetType.token,
            balance: '0xaf',
            details: tokenDetails,
          },
          recipient: {
            address: BURN_ADDRESS,
          },
        }),
      );
      expect(txParams).toStrictEqual({
        from: '0x00',
        data: generateERC20TransferData({
          toAddress: BURN_ADDRESS,
          amount: '0x1',
          sendToken: tokenDetails,
        }),
        to: '0xToken',
        type: '0x0',
        value: '0x0',
        gas: '0x0',
        gasPrice: '0x0',
      });
    });

    it('should generate a txParams for an NFT transfer', () => {
      const txParams = generateTransactionParams(
        getInitialSendStateWithExistingTxState({
          fromAccount: {
            address: '0x00',
          },
          amount: {
            value: '0x1',
          },
          sendAsset: {
            type: AssetType.NFT,
            balance: '0xaf',
            details: {
              address: '0xToken',
              standard: TokenStandard.ERC721,
              tokenId: BigNumber.from(15000).toString(),
            },
          },
          recipient: {
            address: BURN_ADDRESS,
          },
        }),
      );
      expect(txParams).toStrictEqual({
        from: '0x00',
        data: generateERC721TransferData({
          toAddress: BURN_ADDRESS,
          fromAddress: '0x00',
          tokenId: BigNumber.from(15000).toString(),
        }),
        to: '0xToken',
        type: '0x0',
        value: '0x0',
        gas: '0x0',
        gasPrice: '0x0',
      });
    });

    it('should generate a txParams for an ERC1155 transfer', () => {
      const txParams = generateTransactionParams(
        getInitialSendStateWithExistingTxState({
          fromAccount: {
            address: '0x00',
          },
          amount: {
            value: '0x1',
          },
          sendAsset: {
            type: AssetType.NFT,
            balance: '0xaf',
            details: {
              address: '0xToken',
              standard: TokenStandard.ERC1155,
              tokenId: BigNumber.from(15000).toString(),
            },
          },
          recipient: {
            address: BURN_ADDRESS,
          },
        }),
      );
      expect(txParams).toStrictEqual({
        from: '0x00',
        data: generateERC1155TransferData({
          toAddress: BURN_ADDRESS,
          fromAddress: '0x00',
          tokenId: BigNumber.from(15000).toString(),
        }),
        to: '0xToken',
        type: '0x0',
        value: '0x0',
        gas: '0x0',
        gasPrice: '0x0',
      });
    });

    it('should generate a txParams for a native legacy transaction', () => {
      const txParams = generateTransactionParams(
        getInitialSendStateWithExistingTxState({
          fromAccount: {
            address: '0x00',
          },
          amount: {
            value: '0x1',
          },
          sendAsset: {
            type: AssetType.native,
            balance: '0xaf',
            details: null,
          },
          recipient: {
            address: BURN_ADDRESS,
          },
        }),
      );
      expect(txParams).toStrictEqual({
        from: '0x00',
        data: '0x',
        to: BURN_ADDRESS,
        type: '0x0',
        value: '0x1',
        gas: '0x0',
        gasPrice: '0x0',
      });
    });

    it('should generate a txParams for a native fee market transaction', () => {
      const txParams = generateTransactionParams({
        ...getInitialSendStateWithExistingTxState({
          fromAccount: {
            address: '0x00',
          },
          amount: {
            value: '0x1',
          },
          sendAsset: {
            type: AssetType.native,
            balance: '0xaf',
            details: null,
          },
          recipient: {
            address: BURN_ADDRESS,
          },
          gas: {
            maxFeePerGas: '0x2',
            maxPriorityFeePerGas: '0x1',
            gasLimit: GAS_LIMITS.SIMPLE,
          },
          transactionType: TransactionEnvelopeType.feeMarket,
        }),
        eip1559support: true,
      });
      expect(txParams).toStrictEqual({
        from: '0x00',
        data: '0x',
        to: BURN_ADDRESS,
        type: '0x2',
        value: '0x1',
        gas: GAS_LIMITS.SIMPLE,
        maxFeePerGas: '0x2',
        maxPriorityFeePerGas: '0x1',
      });
    });
  });
  describe('addAdjustedReturnToQuotes', () => {
    it('should add adjusted return to quotes', async () => {
      const quotes = [
        {
          gasParams: { maxGas: 21000 },
          trade: {
            data: '0xData',
            to: '0xTo',
            from: '0xFrom',
            value: '1000000000000000000',
          },
          approvalNeeded: null,
          sourceAmount: '1000000000000000000',
          destinationAmount: '2000000000000000000',
          sourceToken: '0x11111111111',
          destinationToken: '0x22222222222',
          sender: '0xSender',
          recipient: '0xRecipient',
          aggregator: 'aggregator',
          aggregatorType: 'type',
          error: null,
          fee: 0,
        },
      ];
      const state = {};
      const destinationAsset = { address: '0x22222222222', decimals: 18 };

      getCurrentChainId.mockReturnValue('1');
      getGasFeeEstimates.mockReturnValue({
        medium: { suggestedMaxFeePerGas: '20' },
      });
      checkNetworkAndAccountSupports1559.mockReturnValue(true);
      getUsedSwapsGasPrice.mockReturnValue('50');
      getTokenExchangeRates.mockReturnValue({ '0x22222222222': '1' });
      getConfirmationExchangeRates.mockReturnValue({});
      getNativeCurrency.mockReturnValue('ETH');
      fetchTokenExchangeRates.mockResolvedValue({ '0x22222222222': 1 });

      const adjustedQuotes = await addAdjustedReturnToQuotes(
        quotes,
        state,
        destinationAsset,
      );

      expect(adjustedQuotes[0]).toHaveProperty('adjustAmountReceivedInNative');
    });

    it('should return original quotes if no quotes are provided', async () => {
      const quotes = [];
      const state = {};
      const destinationAsset = {};

      const adjustedQuotes = await addAdjustedReturnToQuotes(
        quotes,
        state,
        destinationAsset,
      );

      expect(adjustedQuotes).toStrictEqual(quotes);
    });
  });

  describe('calculateBestQuote', () => {
    it('should return the best quote', () => {
      const quotes = [
        { adjustAmountReceivedInNative: 1, destinationAmount: 3 },
        { adjustAmountReceivedInNative: 2, destinationAmount: 2 },
        { adjustAmountReceivedInNative: 3, destinationAmount: 1 },
      ];

      const bestQuote = calculateBestQuote(quotes);

      expect(bestQuote).toStrictEqual(quotes[2]);
    });

    it('should return undefined if no quotes are provided', () => {
      const quotes = [];

      const bestQuote = calculateBestQuote(quotes);

      expect(bestQuote).toBeUndefined();
    });
  });

  describe('getIsDraftSwapAndSend', () => {
    it('should return true if draft transaction is a swap and send', () => {
      const draftTransaction = {
        sendAsset: { details: { address: '0xAddress1' } },
        receiveAsset: { details: { address: '0xAddress2' } },
      };

      const isSwapAndSend = getIsDraftSwapAndSend(draftTransaction);

      expect(isSwapAndSend).toBe(true);
    });

    it('should return false if draft transaction is not a swap and send', () => {
      const draftTransaction = {
        sendAsset: { details: { address: '0xAddress1' } },
        receiveAsset: { details: { address: '0xAddress1' } },
      };

      const isSwapAndSend = getIsDraftSwapAndSend(draftTransaction);

      expect(isSwapAndSend).toBe(false);
    });

    it('should return true if only one asset is native (i.e., no details)', () => {
      const draftTransaction = {
        sendAsset: { details: { address: '0xAddress1' } },
        receiveAsset: { details: null },
      };

      const isSwapAndSend = getIsDraftSwapAndSend(draftTransaction);

      expect(isSwapAndSend).toBe(true);
    });

    it('should return false if only both assets are native (i.e., no details)', () => {
      const draftTransaction = {
        sendAsset: { details: { address: '0xAddress1' } },
        receiveAsset: { details: null },
      };

      const isSwapAndSend = getIsDraftSwapAndSend(draftTransaction);

      expect(isSwapAndSend).toBe(true);
    });
  });
});
