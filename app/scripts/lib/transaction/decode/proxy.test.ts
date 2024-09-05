import EthQuery from '@metamask/eth-query';
import { getContractProxyAddress } from './proxy';

const CONTRACT_ADDRESS_MOCK = '0x456';

function createEthQueryMock(storageValues: string[]): EthQuery {
  const ethQuery = {
    eth_getStorageAt: jest.fn(),
  };

  for (const storageValue of storageValues) {
    ethQuery.eth_getStorageAt.mockImplementationOnce(
      (_contractAddress, _storageSlot, _blockNumber, cb) =>
        cb(null, storageValue),
    );
  }

  return ethQuery as unknown as EthQuery;
}

describe('Proxy', () => {
  describe('getContractProxyAddress', () => {
    it('returns undefined if all responses empty', async () => {
      const ethQuery = createEthQueryMock([
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ]);

      expect(
        await getContractProxyAddress(CONTRACT_ADDRESS_MOCK, ethQuery),
      ).toBeUndefined();
    });

    it('returns first non-empty response', async () => {
      const ethQuery = createEthQueryMock([
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '00000000000000000000000000123',
      ]);

      expect(
        await getContractProxyAddress(CONTRACT_ADDRESS_MOCK, ethQuery),
      ).toBe('0x123');
    });
  });
});
