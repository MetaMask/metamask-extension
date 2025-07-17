import {
  TransactionEnvelopeType,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  PLATFORM_CHROME,
  PLATFORM_EDGE,
  PLATFORM_FIREFOX,
  PLATFORM_OPERA,
} from '../../../shared/constants/app';
import { isPrefixedFormattedHexString } from '../../../shared/modules/network.utils';
import * as FourBiteUtils from '../../../shared/lib/four-byte';
import {
  shouldEmitDappViewedEvent,
  addUrlProtocolPrefix,
  formatTxMetaForRpcResult,
  getEnvironmentType,
  getPlatform,
  getValidUrl,
  isWebUrl,
  getMethodDataName,
  getBooleanFlag,
  extractRpcDomain,
  isKnownDomain,
  initializeRpcProviderDomains,
} from './util';

// Mock the module
jest.mock('./util', () => ({
  ...jest.requireActual('./util'),
  isKnownDomain: jest.fn(),
  initializeRpcProviderDomains: jest.fn(),
}));

describe('app utils', () => {
  describe('getEnvironmentType', () => {
    it('should return popup type', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/popup.html',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_POPUP);
    });

    it('should return notification type', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/notification.html',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_NOTIFICATION);
    });

    it('should return fullscreen type for home.html', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/home.html',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_FULLSCREEN);
    });

    it('should return background type', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/_generated_background_page.html',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_BACKGROUND);
    });

    it('should return the correct type for a URL with a hash fragment', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/popup.html#hash',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_POPUP);
    });

    it('should return the correct type for a URL with query parameters', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/popup.html?param=foo',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_POPUP);
    });

    it('should return the correct type for a URL with query parameters and a hash fragment', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/popup.html?param=foo#hash',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_POPUP);
    });
  });

  describe('URL utils', () => {
    it('should test addUrlProtocolPrefix', () => {
      expect(addUrlProtocolPrefix('http://example.com')).toStrictEqual(
        'http://example.com',
      );
      expect(addUrlProtocolPrefix('https://example.com')).toStrictEqual(
        'https://example.com',
      );
      expect(addUrlProtocolPrefix('example.com')).toStrictEqual(
        'https://example.com',
      );
      expect(addUrlProtocolPrefix('exa mple.com')).toStrictEqual(null);
    });

    it('should test isWebUrl', () => {
      expect(isWebUrl('http://example.com')).toStrictEqual(true);
      expect(isWebUrl('https://example.com')).toStrictEqual(true);
      expect(isWebUrl('https://exa mple.com')).toStrictEqual(false);
      expect(isWebUrl('')).toStrictEqual(false);
    });

    it('should test getValidUrl', () => {
      expect(getValidUrl('http://example.com').toString()).toStrictEqual(
        'http://example.com/',
      );
      expect(getValidUrl('https://example.com').toString()).toStrictEqual(
        'https://example.com/',
      );
      expect(getValidUrl('https://exa%20mple.com')).toStrictEqual(null);
      expect(getValidUrl('')).toStrictEqual(null);
    });
  });

  describe('isPrefixedFormattedHexString', () => {
    it('should return true for valid hex strings', () => {
      expect(isPrefixedFormattedHexString('0x1')).toStrictEqual(true);

      expect(isPrefixedFormattedHexString('0xa')).toStrictEqual(true);

      expect(
        isPrefixedFormattedHexString('0xabcd1123fae909aad87452'),
      ).toStrictEqual(true);
    });

    it('should return false for invalid hex strings', () => {
      expect(isPrefixedFormattedHexString('0x')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString('0x0')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString('0x01')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString(' 0x1')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString('0x1 ')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString('0x1afz')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString('z')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString(2)).toStrictEqual(false);

      expect(isPrefixedFormattedHexString(['0x1'])).toStrictEqual(false);

      expect(isPrefixedFormattedHexString()).toStrictEqual(false);
    });
  });

  describe('getPlatform', () => {
    let userAgent, setBrowserSpecificWindow;

    beforeEach(() => {
      userAgent = jest.spyOn(window.navigator, 'userAgent', 'get');

      setBrowserSpecificWindow = (browser) => {
        switch (browser) {
          case 'firefox': {
            userAgent.mockReturnValue(
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:95.0) Gecko/20100101 Firefox/95.0',
            );
            break;
          }
          case 'edge': {
            userAgent.mockReturnValue(
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36 Edg/95.0.1020.30',
            );
            break;
          }
          case 'opera': {
            userAgent.mockReturnValue(
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36 OPR/80.0.4170.63',
            );

            break;
          }
          default: {
            userAgent.mockReturnValue(
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
            );
            break;
          }
        }
      };
    });

    it('should detect Firefox', () => {
      setBrowserSpecificWindow('firefox');
      expect(getPlatform()).toStrictEqual(PLATFORM_FIREFOX);
    });

    it('should detect Edge', () => {
      setBrowserSpecificWindow('edge');
      expect(getPlatform()).toStrictEqual(PLATFORM_EDGE);
    });

    it('should detect Opera', () => {
      setBrowserSpecificWindow('opera');
      expect(getPlatform()).toStrictEqual(PLATFORM_OPERA);
    });

    it('should detect Chrome', () => {
      setBrowserSpecificWindow('chrome');
      expect(getPlatform()).toStrictEqual(PLATFORM_CHROME);
    });
  });

  describe('Promise.withResolvers', () => {
    it('should allow rejecting a deferred Promise', async () => {
      const { promise, reject } = Promise.withResolvers();

      reject(new Error('test'));

      await expect(promise).rejects.toThrow('test');
    });

    it('should allow resolving a deferred Promise', async () => {
      const { promise, resolve } = Promise.withResolvers();

      resolve('test');

      await expect(promise).resolves.toBe('test');
    });

    it('should still be rejected after reject is called twice', async () => {
      const { promise, reject } = Promise.withResolvers();

      reject(new Error('test'));
      reject(new Error('different message'));

      await expect(promise).rejects.toThrow('test');
    });

    it('should still be rejected after resolve is called post-rejection', async () => {
      const { promise, resolve, reject } = Promise.withResolvers();

      reject(new Error('test'));
      resolve('different message');

      await expect(promise).rejects.toThrow('test');
    });

    it('should still be resolved after resolve is called twice', async () => {
      const { promise, resolve } = Promise.withResolvers();

      resolve('test');
      resolve('different message');

      await expect(promise).resolves.toBe('test');
    });

    it('should still be resolved after reject is called post-resolution', async () => {
      const { promise, resolve, reject } = Promise.withResolvers();

      resolve('test');
      reject(new Error('different message'));

      await expect(promise).resolves.toBe('test');
    });
  });

  describe('shouldEmitDappViewedEvent', () => {
    it('should return true for valid metrics IDs', () => {
      expect(shouldEmitDappViewedEvent('fake-metrics-id-fd20')).toStrictEqual(
        true,
      );
    });
    it('should return false for invalid metrics IDs', () => {
      expect(
        shouldEmitDappViewedEvent('fake-metrics-id-invalid'),
      ).toStrictEqual(false);
    });

    it('should return false for Firefox', () => {
      jest
        .spyOn(window.navigator, 'userAgent', 'get')
        .mockReturnValue(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:95.0) Gecko/20100101 Firefox/95.0',
        );
      expect(shouldEmitDappViewedEvent('fake-metrics-id-fd20')).toStrictEqual(
        false,
      );
    });
  });

  describe('formatTxMetaForRpcResult', () => {
    it('should correctly format the tx meta object (EIP-1559)', () => {
      const txMeta = {
        id: 1,
        status: TransactionStatus.unapproved,
        txParams: {
          from: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          maxFeePerGas: '0x77359400',
          maxPriorityFeePerGas: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        type: TransactionType.simpleSend,
        origin: 'other',
        chainId: '0x5',
        time: 1624408066355,
        hash: '0x4bcb6cd6b182209585f8ad140260ddb35c81a575dd40f508d9767e652a9f60e7',
        r: '0x4c3111e42ed5eec3dcecba1e234700f387e8693c373c61c3e54a762a26f1570e',
        s: '0x18bfc4eeb7ebcfacc3bd59ea100a6834ea3265e65945dbec69aa2a06564fafff',
        v: '0x29',
      };
      const expectedResult = {
        accessList: null,
        blockHash: null,
        blockNumber: null,
        from: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
        gas: '0x7b0d',
        gasPrice: '0x77359400',
        hash: '0x4bcb6cd6b182209585f8ad140260ddb35c81a575dd40f508d9767e652a9f60e7',
        input: '0x',
        maxFeePerGas: '0x77359400',
        maxPriorityFeePerGas: '0x77359400',
        nonce: '0x4b',
        r: '0x4c3111e42ed5eec3dcecba1e234700f387e8693c373c61c3e54a762a26f1570e',
        s: '0x18bfc4eeb7ebcfacc3bd59ea100a6834ea3265e65945dbec69aa2a06564fafff',
        to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        transactionIndex: null,
        type: '0x2',
        v: '0x29',
        value: '0x0',
      };
      const result = formatTxMetaForRpcResult(txMeta);
      expect(result).toStrictEqual(expectedResult);
    });

    it('should correctly format the tx meta object (non EIP-1559)', () => {
      const txMeta = {
        id: 1,
        status: TransactionStatus.unapproved,
        txParams: {
          from: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          gasPrice: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        type: TransactionType.simpleSend,
        origin: 'other',
        chainId: '0x5',
        time: 1624408066355,
        hash: '0x4bcb6cd6b182209585f8ad140260ddb35c81a575dd40f508d9767e652a9f60e7',
        r: '0x4c3111e42ed5eec3dcecba1e234700f387e8693c373c61c3e54a762a26f1570e',
        s: '0x18bfc4eeb7ebcfacc3bd59ea100a6834ea3265e65945dbec69aa2a06564fafff',
        v: '0x29',
      };
      const expectedResult = {
        accessList: null,
        blockHash: null,
        blockNumber: null,
        from: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
        gas: '0x7b0d',
        hash: '0x4bcb6cd6b182209585f8ad140260ddb35c81a575dd40f508d9767e652a9f60e7',
        input: '0x',
        gasPrice: '0x77359400',
        nonce: '0x4b',
        r: '0x4c3111e42ed5eec3dcecba1e234700f387e8693c373c61c3e54a762a26f1570e',
        s: '0x18bfc4eeb7ebcfacc3bd59ea100a6834ea3265e65945dbec69aa2a06564fafff',
        to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        transactionIndex: null,
        type: TransactionEnvelopeType.legacy,
        v: '0x29',
        value: '0x0',
      };
      const result = formatTxMetaForRpcResult(txMeta);
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('getMethodDataName', () => {
    const knownMethodData = {
      '0x60806040': {
        name: 'Approve Tokens',
      },
      '0x095ea7b3': {
        name: 'Approve Tokens',
      },
    };

    it('return null if use4ByteResolution is not true', async () => {
      expect(
        await getMethodDataName(knownMethodData, false, '0x60806040'),
      ).toStrictEqual(null);
    });

    it('return null if prefixedData is not defined', async () => {
      expect(
        await getMethodDataName(knownMethodData, true, undefined),
      ).toStrictEqual(null);
    });

    it('return details from knownMethodData if defined', async () => {
      expect(
        await getMethodDataName(knownMethodData, true, '0x60806040'),
      ).toStrictEqual(knownMethodData['0x60806040']);
    });

    it('invoke getMethodDataAsync if details not available in knownMethodData', async () => {
      const DUMMY_METHOD_NAME = {
        name: 'Dummy Method Name',
      };
      jest
        .spyOn(FourBiteUtils, 'getMethodDataAsync')
        .mockResolvedValue(DUMMY_METHOD_NAME);
      expect(
        await getMethodDataName(knownMethodData, true, '0x123', jest.fn()),
      ).toStrictEqual(DUMMY_METHOD_NAME);
    });

    it('invoke addKnownMethodData if details not available in knownMethodData', async () => {
      const DUMMY_METHOD_NAME = {
        name: 'Dummy Method Name',
      };
      const addKnownMethodData = jest.fn();
      jest
        .spyOn(FourBiteUtils, 'getMethodDataAsync')
        .mockResolvedValue(DUMMY_METHOD_NAME);
      expect(
        await getMethodDataName(
          knownMethodData,
          true,
          '0x123',
          addKnownMethodData,
        ),
      ).toStrictEqual(DUMMY_METHOD_NAME);
      expect(addKnownMethodData).toHaveBeenCalledTimes(1);
    });

    it('does not invoke addKnownMethodData if no method data available', async () => {
      const addKnownMethodData = jest.fn();

      jest.spyOn(FourBiteUtils, 'getMethodDataAsync').mockResolvedValue({});

      expect(
        await getMethodDataName(
          knownMethodData,
          true,
          '0x123',
          addKnownMethodData,
        ),
      ).toStrictEqual({});

      expect(addKnownMethodData).toHaveBeenCalledTimes(0);
    });
  });

  describe('getBooleanFlag', () => {
    it('returns `true` for `true` and `"true"`', () => {
      expect(getBooleanFlag(true)).toBe(true);
      expect(getBooleanFlag('true')).toBe(true);
    });

    it('returns `false` for other values', () => {
      expect(getBooleanFlag(false)).toBe(false);
      expect(getBooleanFlag('false')).toBe(false);
      expect(getBooleanFlag(undefined)).toBe(false);
      expect(getBooleanFlag('foo')).toBe(false);
    });
  });

  describe('RPC URL handling utilities', () => {
    describe('isKnownDomain', () => {
      beforeEach(() => {
        const testKnownDomains = new Set([
          'mainnet.infura.io',
          'eth-mainnet.alchemyapi.io',
        ]);

        isKnownDomain.mockImplementation((domain) => {
          if (!domain) {
            return false;
          }
          return testKnownDomains.has(domain.toLowerCase());
        });
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should correctly identify known domains', () => {
        expect(isKnownDomain('mainnet.infura.io')).toBe(true);
        expect(isKnownDomain('MAINNET.INFURA.IO')).toBe(true);
        expect(isKnownDomain('unknown-domain.com')).toBe(false);
        expect(isKnownDomain(null)).toBe(false);
        expect(isKnownDomain('')).toBe(false);
      });
    });

    describe('initializeRpcProviderDomains', () => {
      let mockPromise;

      beforeEach(() => {
        mockPromise = Promise.resolve();
        initializeRpcProviderDomains.mockReturnValue(mockPromise);
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should return a promise', async () => {
        const result = initializeRpcProviderDomains();
        expect(result).toBeInstanceOf(Promise);
        await result;
      });

      it('should reuse the same promise on subsequent calls', () => {
        const result1 = initializeRpcProviderDomains();
        const result2 = initializeRpcProviderDomains();
        expect(result1).toBe(result2);
      });
    });
  });

  describe('extractRpcDomain', () => {
    const testKnownDomains = new Set([
      'mainnet.infura.io',
      'linea-goerli.infura.io',
      'eth-mainnet.alchemyapi.io',
      'rpc.tenderly.co',
    ]);

    it('should extract domain from known URLs', () => {
      expect(
        extractRpcDomain(
          'https://mainnet.infura.io/v3/abc123',
          testKnownDomains,
        ),
      ).toBe('mainnet.infura.io');

      expect(
        extractRpcDomain(
          'https://eth-mainnet.alchemyapi.io/v2/key',
          testKnownDomains,
        ),
      ).toBe('eth-mainnet.alchemyapi.io');

      expect(
        extractRpcDomain(
          'https://MAINNET.INFURA.IO/v3/abc123',
          testKnownDomains,
        ),
      ).toBe('mainnet.infura.io');
    });

    it('should handle URLs without protocol for known domains', () => {
      expect(
        extractRpcDomain('mainnet.infura.io/v3/abc123', testKnownDomains),
      ).toBe('mainnet.infura.io');
    });

    it('should return private for any unknown domain', () => {
      expect(extractRpcDomain('http://localhost:8545')).toBe('private');
      expect(extractRpcDomain('https://unknown-domain.com')).toBe('private');
      expect(extractRpcDomain('http://192.168.1.1:8545')).toBe('private');
      expect(extractRpcDomain('ws://custom-domain.xyz')).toBe('private');
      expect(extractRpcDomain('https://rpc.ankr.com/eth_goerli')).toBe(
        'private',
      );
    });

    it('should handle invalid URLs and edge cases', () => {
      expect(extractRpcDomain('')).toBe('invalid');
      expect(extractRpcDomain(null)).toBe('invalid');
      expect(extractRpcDomain('http://')).toBe('invalid');
      expect(extractRpcDomain('https://')).toBe('invalid');
    });
  });
});
