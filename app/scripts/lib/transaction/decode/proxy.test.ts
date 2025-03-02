import type { Provider } from '@metamask/network-controller';
import { getContractProxyAddress } from './proxy';

const CONTRACT_ADDRESS_MOCK = '0x456';

function createProviderMock(storageValues: string[]): Provider {
  const ethGetStorageAt = jest.fn();

  for (const storageValue of storageValues) {
    ethGetStorageAt.mockImplementationOnce(() => storageValue);
  }

  return {
    request: async (request) => {
      if (request.method === 'eth_getStorageAt') {
        return ethGetStorageAt(request);
      }
      throw new Error(`Unexpected method: ${request.method}`);
    },
  } as Provider;
}

describe('Proxy', () => {
  describe('getContractProxyAddress', () => {
    it('returns undefined if all responses empty', async () => {
      const provider = createProviderMock([
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ]);

      expect(
        await getContractProxyAddress(CONTRACT_ADDRESS_MOCK, provider),
      ).toBeUndefined();
    });

    it('returns first non-empty response', async () => {
      const provider = createProviderMock([
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '00000000000000000000000000123',
      ]);

      expect(
        await getContractProxyAddress(CONTRACT_ADDRESS_MOCK, provider),
      ).toBe('0x123');
    });
  });
});
