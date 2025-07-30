import { Hex } from '@metamask/utils';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import {
  getNetworkData,
  getNetworkDataByChainId,
  buildUrl,
  SentinelNetwork,
} from './sentinel-api';

jest.mock('../../../../shared/modules/fetch-with-timeout');
jest.mock('../../../../shared/modules/conversion.utils');

const fetchMock: jest.MockedFunction<ReturnType<typeof getFetchWithTimeout>> = jest.fn();

const NETWORK_ETHEREUM_MOCK = 'ethereum-mainnet';

const COMMON_ETH: SentinelNetwork['nativeCurrency'] = {
  name: 'ETH',
  symbol: 'ETH',
  decimals: 18,
};
const COMMON_MATIC: SentinelNetwork['nativeCurrency'] = {
  name: 'MATIC',
  symbol: 'MATIC',
  decimals: 18,
};

const MAINNET_BASE = {
  name: 'Mainnet',
  group: 'ethereum',
  chainID: 1,
  nativeCurrency: COMMON_ETH,
  network: NETWORK_ETHEREUM_MOCK,
  explorer: 'https://etherscan.io',
  confirmations: true,
  smartTransactions: true,
  relayTransactions: true,
  hidden: false,
  sendBundle: true,
} as const;

const POLYGON_BASE = {
  name: 'Polygon',
  group: 'polygon',
  chainID: 137,
  nativeCurrency: COMMON_MATIC,
  network: 'polygon-mainnet',
  explorer: 'https://polygonscan.com',
  confirmations: true,
  smartTransactions: false,
  relayTransactions: false,
  hidden: false,
  sendBundle: false,
} as const;

const MOCK_NETWORKS: Record<string, SentinelNetwork> = {
  '1': { ...MAINNET_BASE },
  '137': { ...POLYGON_BASE },
};

describe('sentinel-api', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(getFetchWithTimeout).mockReturnValue(fetchMock);
  });

  describe('buildUrl', () => {
    it('builds the correct sentinel API URL for a subdomain', () => {
      expect(buildUrl('my-chain')).toBe(
        'https://tx-sentinel-my-chain.api.cx.metamask.io/',
      );
      expect(buildUrl(NETWORK_ETHEREUM_MOCK)).toBe(
        'https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io/',
      );
    });
  });

  describe('getNetworkData', () => {
    it('fetches and returns all network data', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => MOCK_NETWORKS,
        ok: true,
      } as Response);

      const result = await getNetworkData();
      expect(getFetchWithTimeout).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io/networks',
      );
      expect(result).toStrictEqual(MOCK_NETWORKS);
    });

    it('throws if the fetch fails', async () => {
      // Simulate a network error
      fetchMock.mockRejectedValueOnce(new Error('API Err'));
      await expect(getNetworkData()).rejects.toThrow('API Err');
    });
  });

  describe('getNetworkDataByChainId', () => {
    const mainnetHex: Hex = '0x1';
    const polygonHex: Hex = '0x89';

    beforeEach(() => {
      // Default mock: hexToDecimal returns decimal string
      (hexToDecimal as jest.Mock).mockImplementation((hex: string) => {
        if (hex === '0x1') return '1';
        if (hex === '0x89') return '137';
        return '12345';
      });
    });

    it('returns network data for provided chainId (Mainnet)', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => MOCK_NETWORKS,
        ok: true,
      } as Response);

      const result = await getNetworkDataByChainId(mainnetHex);
      expect(hexToDecimal).toHaveBeenCalledWith('0x1');
      expect(result).toStrictEqual(MAINNET_BASE);
    });

    it('returns network data for another registered chainId (Polygon)', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => MOCK_NETWORKS,
        ok: true,
      } as Response);

      const result = await getNetworkDataByChainId(polygonHex);
      expect(hexToDecimal).toHaveBeenCalledWith('0x89');
      expect(result).toStrictEqual(POLYGON_BASE);
    });

    it('returns undefined for chainId not in network data', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => MOCK_NETWORKS,
        ok: true,
      } as Response);
      (hexToDecimal as jest.Mock).mockReturnValue('99999');
      const result = await getNetworkDataByChainId('0xFAFA' as Hex);
      expect(result).toBeUndefined();
    });

    it('throws if getNetworkData throws', async () => {
      fetchMock.mockRejectedValueOnce(new Error('API connection error'));
      await expect(getNetworkDataByChainId('0x1' as Hex)).rejects.toThrow('API connection error');
    });
  });
});
