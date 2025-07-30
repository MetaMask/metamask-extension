import { Hex } from '@metamask/utils';
import { getNetworkDataByChainId, SentinelNetwork } from './sentinel-api';
import { isSendBundleSupported } from './transaction-send-bundle';

jest.mock('./sentinel-api');

const COMMON_ETH = {
  name: 'ETH',
  symbol: 'ETH',
  decimals: 18,
} as const;

const COMMON_MATIC = {
  name: 'MATIC',
  symbol: 'MATIC',
  decimals: 18,
} as const;

const BASE_ETH_MAINNET = {
  name: 'Mainnet',
  group: 'ethereum',
  chainID: 1,
  nativeCurrency: COMMON_ETH,
  network: 'ethereum-mainnet',
  explorer: 'https://etherscan.io',
  confirmations: true,
  smartTransactions: true,
  relayTransactions: true,
  hidden: false,
} as const;

const BASE_POLYGON = {
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
} as const;

const ETH_MAINNET_SEND_BUNDLE_TRUE = {
  ...BASE_ETH_MAINNET,
  sendBundle: true,
};

const ETH_MAINNET_SEND_BUNDLE_FALSE = {
  ...BASE_ETH_MAINNET,
  sendBundle: false,
};

const POLYGON_SEND_BUNDLE_FALSE = {
  ...BASE_POLYGON,
  sendBundle: false,
};

describe('isSendBundleSupported', () => {
  const getNetworkDataByChainIdMock = jest.mocked(getNetworkDataByChainId);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true if network supports sendBundle', async () => {
    getNetworkDataByChainIdMock.mockResolvedValueOnce(
      ETH_MAINNET_SEND_BUNDLE_TRUE,
    );
    const result = await isSendBundleSupported('0x1' as Hex);
    expect(result).toBe(true);
    expect(getNetworkDataByChainIdMock).toHaveBeenCalledWith('0x1');
  });

  it('returns false if sendBundle is false', async () => {
    getNetworkDataByChainIdMock.mockResolvedValueOnce(
      ETH_MAINNET_SEND_BUNDLE_FALSE,
    );
    const result = await isSendBundleSupported('0x1' as Hex);
    expect(result).toBe(false);
    expect(getNetworkDataByChainIdMock).toHaveBeenCalledWith('0x1');
  });

  it('returns false if network is undefined', async () => {
    getNetworkDataByChainIdMock.mockResolvedValueOnce(undefined);
    const result = await isSendBundleSupported('0xFAFA' as Hex);
    expect(result).toBe(false);
    expect(getNetworkDataByChainIdMock).toHaveBeenCalledWith('0xFAFA');
  });

  it('returns false if sendBundle is missing', async () => {
    const BAD_NETWORK = { ...BASE_ETH_MAINNET } as unknown as SentinelNetwork;
    getNetworkDataByChainIdMock.mockResolvedValueOnce(BAD_NETWORK);
    const result = await isSendBundleSupported('0x1' as Hex);
    expect(result).toBe(false);
    expect(getNetworkDataByChainIdMock).toHaveBeenCalledWith('0x1');
  });

  it('returns false for another network where sendBundle is false', async () => {
    getNetworkDataByChainIdMock.mockResolvedValueOnce(
      POLYGON_SEND_BUNDLE_FALSE,
    );
    const result = await isSendBundleSupported('0x89' as Hex);
    expect(result).toBe(false);
    expect(getNetworkDataByChainIdMock).toHaveBeenCalledWith('0x89');
  });
});
