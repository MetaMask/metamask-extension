import { handleFetch } from '@metamask/controller-utils';

import {
  CHAIN_IDS,
  ETHERSCAN_SUPPORTED_NETWORKS,
} from '../../../../shared/constants/network';
import type {
  EtherscanTransactionMeta,
  EtherscanTransactionRequest,
  EtherscanTransactionResponse,
} from './etherscan';
import * as Etherscan from './etherscan';

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  handleFetch: jest.fn(),
}));

const ADDERSS_MOCK = '0x2A2D72308838A6A46a0B5FDA3055FE915b5D99eD';

const REQUEST_MOCK: EtherscanTransactionRequest = {
  address: ADDERSS_MOCK,
  chainId: CHAIN_IDS.GOERLI,
  limit: 3,
  fromBlock: 2,
  apiKey: 'testApiKey',
};

const RESPONSE_MOCK: EtherscanTransactionResponse<EtherscanTransactionMeta> = {
  result: [
    { from: ADDERSS_MOCK, nonce: '0x1' } as EtherscanTransactionMeta,
    { from: ADDERSS_MOCK, nonce: '0x2' } as EtherscanTransactionMeta,
  ],
};

describe('Etherscan', () => {
  const handleFetchMock = handleFetch as jest.MockedFunction<
    typeof handleFetch
  >;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe.each([
    ['fetchEtherscanTransactions', 'txlist'],
    ['fetchEtherscanTokenTransactions', 'tokentx'],
  ])('%s', (method, action) => {
    it('returns fetched response', async () => {
      handleFetchMock.mockResolvedValueOnce(RESPONSE_MOCK);

      const result = await (Etherscan as any)[method](REQUEST_MOCK);

      expect(result).toStrictEqual(RESPONSE_MOCK);
    });

    it('fetches from Etherscan URL', async () => {
      handleFetchMock.mockResolvedValueOnce(RESPONSE_MOCK);

      await (Etherscan as any)[method](REQUEST_MOCK);

      expect(handleFetchMock).toHaveBeenCalledTimes(1);
      expect(handleFetchMock).toHaveBeenCalledWith(
        `https://${ETHERSCAN_SUPPORTED_NETWORKS[CHAIN_IDS.GOERLI].subdomain}.${
          ETHERSCAN_SUPPORTED_NETWORKS[CHAIN_IDS.GOERLI].domain
        }/api?` +
          `module=account` +
          `&address=${REQUEST_MOCK.address}` +
          `&startBlock=${REQUEST_MOCK.fromBlock}` +
          `&apikey=${REQUEST_MOCK.apiKey}` +
          `&offset=${REQUEST_MOCK.limit}` +
          `&order=desc` +
          `&action=${action}` +
          `&tag=latest` +
          `&page=1`,
      );
    });

    it('supports alternate networks', async () => {
      handleFetchMock.mockResolvedValueOnce(RESPONSE_MOCK);

      await (Etherscan as any)[method]({
        ...REQUEST_MOCK,
        chainId: CHAIN_IDS.MAINNET,
      });

      expect(handleFetchMock).toHaveBeenCalledTimes(1);
      expect(handleFetchMock).toHaveBeenCalledWith(
        `https://${ETHERSCAN_SUPPORTED_NETWORKS[CHAIN_IDS.MAINNET].subdomain}.${
          ETHERSCAN_SUPPORTED_NETWORKS[CHAIN_IDS.MAINNET].domain
        }/api?` +
          `module=account` +
          `&address=${REQUEST_MOCK.address}` +
          `&startBlock=${REQUEST_MOCK.fromBlock}` +
          `&apikey=${REQUEST_MOCK.apiKey}` +
          `&offset=${REQUEST_MOCK.limit}` +
          `&order=desc` +
          `&action=${action}` +
          `&tag=latest` +
          `&page=1`,
      );
    });

    it('throws if message is not ok', async () => {
      handleFetchMock.mockResolvedValueOnce({
        status: '0',
        message: 'NOTOK',
        result: 'test error',
      });

      await expect((Etherscan as any)[method](REQUEST_MOCK)).rejects.toThrow(
        'Etherscan request failed - test error',
      );
    });

    it('throws if chain is not supported', async () => {
      const unsupportedChainId = '0x11111111111111111111';

      await expect(
        (Etherscan as any)[method]({
          ...REQUEST_MOCK,
          chainId: unsupportedChainId,
        }),
      ).rejects.toThrow(
        `Etherscan does not support chain with ID: ${unsupportedChainId}`,
      );
    });

    it('does not include empty values in fetched URL', async () => {
      handleFetchMock.mockResolvedValueOnce(RESPONSE_MOCK);

      await (Etherscan as any)[method]({
        ...REQUEST_MOCK,
        fromBlock: undefined,
        apiKey: undefined,
      });

      expect(handleFetchMock).toHaveBeenCalledTimes(1);
      expect(handleFetchMock).toHaveBeenCalledWith(
        `https://${ETHERSCAN_SUPPORTED_NETWORKS[CHAIN_IDS.GOERLI].subdomain}.${
          ETHERSCAN_SUPPORTED_NETWORKS[CHAIN_IDS.GOERLI].domain
        }/api?` +
          `module=account` +
          `&address=${REQUEST_MOCK.address}` +
          `&offset=${REQUEST_MOCK.limit}` +
          `&order=desc` +
          `&action=${action}` +
          `&tag=latest` +
          `&page=1`,
      );
    });
  });
});
