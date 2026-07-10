import { Hex } from '@metamask/utils';
import { hexToDecimal } from '../../../../shared/lib/conversion.utils';
import {
  type SentinelNetworksMessenger,
  getSentinelNetworkFlags,
  getSendBundleSupportedChains,
  isSendBundleSupported,
} from './sentinel-api';

jest.mock('../../../../shared/lib/conversion.utils');

const NETWORK_ETHEREUM_MOCK = 'ethereum-mainnet';

const MAINNET_BASE = {
  network: NETWORK_ETHEREUM_MOCK,
  confirmations: true,
  smartTransactions: true,
  relayTransactions: true,
  sendBundle: true,
} as const;

const POLYGON_BASE = {
  network: 'polygon-mainnet',
  confirmations: true,
  smartTransactions: false,
  relayTransactions: false,
  sendBundle: false,
} as const;

const MOCK_NETWORKS = {
  '1': { ...MAINNET_BASE },
  '137': { ...POLYGON_BASE },
};

/**
 * Builds a mock messenger whose `SentinelApiService:getNetworks` call resolves
 * to the provided registry.
 *
 * @returns The mock messenger and its `call` jest mock.
 */
function buildMessengerMock() {
  const call = jest.fn();
  const messenger = { call } as unknown as SentinelNetworksMessenger;
  return { messenger, call };
}

describe('sentinel-api', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    (hexToDecimal as jest.Mock).mockImplementation((hex: string) => {
      if (hex === '0x1') {
        return '1';
      }
      if (hex === '0x89') {
        return '137';
      }
      return '12345';
    });
  });

  describe('getSentinelNetworkFlags', () => {
    const mainnetHex: Hex = '0x1';
    const polygonHex: Hex = '0x89';

    it('returns network data for provided chainId (Mainnet)', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce(MOCK_NETWORKS);

      const result = await getSentinelNetworkFlags(messenger, mainnetHex);

      expect(hexToDecimal).toHaveBeenCalledWith('0x1');
      expect(result).toStrictEqual(MAINNET_BASE);
      expect(call).toHaveBeenCalledWith('SentinelApiService:getNetworks');
    });

    it('returns network data for another registered chainId (Polygon)', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce(MOCK_NETWORKS);

      const result = await getSentinelNetworkFlags(messenger, polygonHex);

      expect(hexToDecimal).toHaveBeenCalledWith('0x89');
      expect(result).toStrictEqual(POLYGON_BASE);
    });

    it('returns undefined for chainId not in network data', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce(MOCK_NETWORKS);
      (hexToDecimal as jest.Mock).mockReturnValue('99999');

      const result = await getSentinelNetworkFlags(messenger, '0xFAFA' as Hex);

      expect(result).toBeUndefined();
    });

    it('returns undefined if the networks request throws', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockRejectedValueOnce(new Error('API connection error'));

      await expect(
        getSentinelNetworkFlags(messenger, '0x1' as Hex),
      ).resolves.toBe(undefined);
    });
  });

  describe('getSendBundleSupportedChains', () => {
    const chainIds: Hex[] = ['0x1', '0x89', '0xFAFA'];

    it('returns a map of chain IDs to sendBundle support status', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce(MOCK_NETWORKS);

      const result = await getSendBundleSupportedChains(messenger, chainIds);

      expect(result).toEqual({
        '0x1': true,
        '0x89': false,
        '0xFAFA': false,
      });
    });

    it('returns false for unsupported chains', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce(MOCK_NETWORKS);

      const result = await getSendBundleSupportedChains(messenger, ['0xFAFA']);

      expect(result).toEqual({ '0xFAFA': false });
    });

    it('returns false for all chains if the networks request throws', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockRejectedValueOnce(new Error('API connection error'));

      const result = await getSendBundleSupportedChains(messenger, chainIds);

      expect(result).toEqual({
        '0x1': false,
        '0x89': false,
        '0xFAFA': false,
      });
    });
  });

  describe('isSendBundleSupported', () => {
    const mainnetHex: Hex = '0x1';
    const polygonHex: Hex = '0x89';

    it('returns true if network supports sendBundle', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce(MOCK_NETWORKS);

      const result = await isSendBundleSupported(messenger, mainnetHex);

      expect(result).toBe(true);
      expect(call).toHaveBeenCalledTimes(1);
    });

    it('returns false if sendBundle is false', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce({
        ...MOCK_NETWORKS,
        '1': { ...MAINNET_BASE, sendBundle: false },
      });

      const result = await isSendBundleSupported(messenger, mainnetHex);

      expect(result).toBe(false);
    });

    it('returns false if network is undefined', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce({});

      const result = await isSendBundleSupported(messenger, '0xFAFA' as Hex);

      expect(result).toBe(false);
    });

    it('returns false if sendBundle is missing', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce({
        ...MOCK_NETWORKS,
        '1': { network: NETWORK_ETHEREUM_MOCK, relayTransactions: true },
      });

      const result = await isSendBundleSupported(messenger, mainnetHex);

      expect(result).toBe(false);
    });

    it('returns false for another network where sendBundle is false', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce(MOCK_NETWORKS);

      const result = await isSendBundleSupported(messenger, polygonHex);

      expect(result).toBe(false);
    });

    it('returns false if the request throws', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockRejectedValueOnce(new Error('API error!'));

      await expect(isSendBundleSupported(messenger, mainnetHex)).resolves.toBe(
        false,
      );
    });
  });
});
