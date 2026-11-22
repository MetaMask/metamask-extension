import {
  SentinelChainNotSupportedError,
  type SentinelNetwork,
} from '@metamask/sentinel-api-service';
import { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  SentinelApiMessenger,
  getSendBundleSupportedChains,
  getSentinelNetworkFlags,
  getSentinelSigners,
  isSendBundleSupported,
  setSentinelApiMessenger,
} from './sentinel-api';

const MAINNET_NETWORK_MOCK: SentinelNetwork = {
  chainID: 1,
  confirmations: true,
  network: 'ethereum-mainnet',
  relayTransactions: true,
  sendBundle: true,
  simulationIncludeFees: true,
  smartTransactions: true,
};

const POLYGON_NETWORK_MOCK: SentinelNetwork = {
  chainID: 137,
  confirmations: true,
  network: 'polygon-mainnet',
  relayTransactions: false,
  sendBundle: false,
  simulationIncludeFees: true,
  smartTransactions: false,
};

const SIGNERS_MOCK: Hex[] = [
  '0xB01caEa8c6C47bbf4F4b4c5080Ca642043359C2E',
  '0xB42F812A44c22cc6b861478900401ee759EbEAD6',
];

describe('sentinel-api', () => {
  const getNetworkMock = jest.fn();
  const getNetworksMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    setSentinelApiMessenger({
      call: (action: string, ...args: unknown[]) => {
        if (action === 'SentinelApiService:getNetwork') {
          return getNetworkMock(...args);
        }

        return getNetworksMock(...args);
      },
    } as SentinelApiMessenger);

    getNetworkMock.mockResolvedValue(MAINNET_NETWORK_MOCK);
    getNetworksMock.mockResolvedValue({
      '1': MAINNET_NETWORK_MOCK,
      '137': POLYGON_NETWORK_MOCK,
    });
  });

  afterAll(() => {
    setSentinelApiMessenger(undefined);
  });

  describe('getSentinelNetworkFlags', () => {
    it('returns network from service', async () => {
      const result = await getSentinelNetworkFlags(CHAIN_IDS.MAINNET);

      expect(getNetworkMock).toHaveBeenCalledWith(CHAIN_IDS.MAINNET);
      expect(result).toStrictEqual(MAINNET_NETWORK_MOCK);
    });

    it('returns undefined if chain not supported', async () => {
      getNetworkMock.mockRejectedValueOnce(
        new SentinelChainNotSupportedError('0x123'),
      );

      expect(await getSentinelNetworkFlags('0x123')).toBeUndefined();
    });

    it('returns undefined if service throws', async () => {
      getNetworkMock.mockRejectedValueOnce(new Error('Test error'));

      expect(await getSentinelNetworkFlags(CHAIN_IDS.MAINNET)).toBeUndefined();
    });

    it('returns undefined if messenger not set', async () => {
      setSentinelApiMessenger(undefined);

      expect(await getSentinelNetworkFlags(CHAIN_IDS.MAINNET)).toBeUndefined();
    });
  });

  describe('isSendBundleSupported', () => {
    it('returns true if network supports sendBundle', async () => {
      expect(await isSendBundleSupported(CHAIN_IDS.MAINNET)).toBe(true);
    });

    it('returns false if sendBundle is false', async () => {
      getNetworkMock.mockResolvedValueOnce(POLYGON_NETWORK_MOCK);

      expect(await isSendBundleSupported(CHAIN_IDS.POLYGON)).toBe(false);
    });

    it('returns false if sendBundle is missing', async () => {
      getNetworkMock.mockResolvedValueOnce({ network: 'test' });

      expect(await isSendBundleSupported(CHAIN_IDS.MAINNET)).toBe(false);
    });

    it('returns false if service throws', async () => {
      getNetworkMock.mockRejectedValueOnce(new Error('Test error'));

      expect(await isSendBundleSupported(CHAIN_IDS.MAINNET)).toBe(false);
    });
  });

  describe('getSentinelSigners', () => {
    it('returns the cubist signers for the chain', async () => {
      getNetworkMock.mockResolvedValueOnce({
        ...MAINNET_NETWORK_MOCK,
        cubistSigners: SIGNERS_MOCK,
      });

      expect(await getSentinelSigners(CHAIN_IDS.MAINNET)).toStrictEqual(
        SIGNERS_MOCK,
      );
    });

    it('returns an empty array if cubist signers are missing', async () => {
      expect(await getSentinelSigners(CHAIN_IDS.MAINNET)).toStrictEqual([]);
    });

    it('returns an empty array if cubist signers is not an array', async () => {
      getNetworkMock.mockResolvedValueOnce({
        ...MAINNET_NETWORK_MOCK,
        cubistSigners: 'invalid',
      });

      expect(await getSentinelSigners(CHAIN_IDS.MAINNET)).toStrictEqual([]);
    });

    it('returns an empty array if the chain is not supported', async () => {
      getNetworkMock.mockRejectedValueOnce(
        new SentinelChainNotSupportedError('0x123'),
      );

      expect(await getSentinelSigners('0x123')).toStrictEqual([]);
    });

    it('returns an empty array if service throws', async () => {
      getNetworkMock.mockRejectedValueOnce(new Error('Test error'));

      expect(await getSentinelSigners(CHAIN_IDS.MAINNET)).toStrictEqual([]);
    });
  });

  describe('getSendBundleSupportedChains', () => {
    it('returns a map of chain IDs to sendBundle support status', async () => {
      const result = await getSendBundleSupportedChains([
        CHAIN_IDS.MAINNET,
        CHAIN_IDS.POLYGON,
        '0x123',
      ]);

      expect(getNetworksMock).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual({
        [CHAIN_IDS.MAINNET]: true,
        [CHAIN_IDS.POLYGON]: false,
        '0x123': false,
      });
    });

    it('returns false for all chains if service throws', async () => {
      getNetworksMock.mockRejectedValueOnce(new Error('Test error'));

      const result = await getSendBundleSupportedChains([
        CHAIN_IDS.MAINNET,
        CHAIN_IDS.POLYGON,
      ]);

      expect(result).toStrictEqual({
        [CHAIN_IDS.MAINNET]: false,
        [CHAIN_IDS.POLYGON]: false,
      });
    });
  });
});
