import type { Provider } from '@metamask/network-controller';
import {
  TRANSACTION_DATA_FOUR_BYTE,
  TRANSACTION_DATA_SOURCIFY,
  TRANSACTION_DATA_UNISWAP,
  TRANSACTION_DECODE_FOUR_BYTE,
  TRANSACTION_DECODE_SOURCIFY,
  TRANSACTION_DECODE_UNISWAP,
} from '../../../../../test/data/confirmations/transaction-decode';
import { decodeUniswapRouterTransactionData } from './uniswap';
import { decodeTransactionData } from './util';
import { decodeTransactionDataWithSourcify } from './sourcify';
import { decodeTransactionDataWithFourByte } from './four-byte';
import { getContractProxyAddress } from './proxy';

jest.mock('./uniswap');
jest.mock('./sourcify');
jest.mock('./four-byte');
jest.mock('./proxy');

const CONTRACT_ADDRESS_MOCK = '0x456';
const CHAIN_ID_MOCK = '0x123';
const PROVIDER_MOCK = {} as Provider;

describe('Transaction Decode Utils', () => {
  const decodeUniswapRouterTransactionDataMock = jest.mocked(
    decodeUniswapRouterTransactionData,
  );

  const decodeTransactionDataWithSourcifyMock = jest.mocked(
    decodeTransactionDataWithSourcify,
  );

  const decodeTransactionDataWithFourByteMock = jest.mocked(
    decodeTransactionDataWithFourByte,
  );

  const getContractProxyAddressMock = jest.mocked(getContractProxyAddress);

  beforeEach(() => {
    jest.resetAllMocks();

    decodeUniswapRouterTransactionDataMock.mockReturnValue(undefined);
    decodeTransactionDataWithSourcifyMock.mockResolvedValue(undefined);
    decodeTransactionDataWithFourByteMock.mockResolvedValue(undefined);
    getContractProxyAddressMock.mockResolvedValue(undefined);
  });

  describe('decodeTransactionData', () => {
    it('returns uniswap data', async () => {
      decodeUniswapRouterTransactionDataMock.mockReturnValue(
        TRANSACTION_DECODE_UNISWAP.data,
      );

      const result = await decodeTransactionData({
        transactionData: TRANSACTION_DATA_UNISWAP,
        contractAddress: CONTRACT_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
        provider: PROVIDER_MOCK,
      });

      expect(result).toStrictEqual(TRANSACTION_DECODE_UNISWAP);
    });

    it('returns sourcify data', async () => {
      decodeTransactionDataWithSourcifyMock.mockResolvedValue(
        TRANSACTION_DECODE_SOURCIFY.data[0],
      );

      const result = await decodeTransactionData({
        transactionData: TRANSACTION_DATA_SOURCIFY,
        contractAddress: CONTRACT_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
        provider: PROVIDER_MOCK,
      });

      expect(result).toStrictEqual(TRANSACTION_DECODE_SOURCIFY);
    });

    it('returns four byte data', async () => {
      decodeTransactionDataWithFourByteMock.mockResolvedValue(
        TRANSACTION_DECODE_FOUR_BYTE.data[0],
      );

      const result = await decodeTransactionData({
        transactionData: TRANSACTION_DATA_FOUR_BYTE,
        contractAddress: CONTRACT_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
        provider: PROVIDER_MOCK,
      });

      expect(result).toStrictEqual(TRANSACTION_DECODE_FOUR_BYTE);
    });

    it('returns undefined if no data', async () => {
      const result = await decodeTransactionData({
        transactionData: TRANSACTION_DATA_FOUR_BYTE,
        contractAddress: CONTRACT_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
        provider: PROVIDER_MOCK,
      });

      expect(result).toBeUndefined();
    });
  });
});
