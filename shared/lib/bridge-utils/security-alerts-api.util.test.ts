import nock from 'nock';
import {
  TokenFeature,
  TokenFeatureType,
} from '../../types/security-alerts-api';
import { MultichainNetworks } from '../../constants/multichain/networks';
import {
  getTokenFeatureTitleDescriptionIds,
  fetchTxAlerts,
  convertChainIdToBlockAidChainName,
  isSecurityAlertsAPIEnabled,
} from './security-alerts-api.util';

// Mock environment variables
const originalEnv = process.env;
const BASE_URL = 'https://api.example.com';

let signal: AbortSignal;

describe('Security alerts utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    signal = new AbortController().signal;
    process.env = { ...originalEnv };
    process.env.SECURITY_ALERTS_API_ENABLED = 'true';
    process.env.SECURITY_ALERTS_API_URL = BASE_URL;
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getTokenFeatureTitleDescriptionIds', () => {
    it('should correctly add title Id and Description Id', async () => {
      const mockTokenAlert = {
        type: TokenFeatureType.MALICIOUS,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        feature_id: 'UNSTABLE_TOKEN_PRICE',
        description: 'This token is Malicious',
      } as TokenFeature;

      const tokenAlertWithLabelIds =
        getTokenFeatureTitleDescriptionIds(mockTokenAlert);
      expect(tokenAlertWithLabelIds.titleId).toBeTruthy();
      expect(tokenAlertWithLabelIds.descriptionId).toBeTruthy();
    });

    it('should correctly return title Id and Description Id null if not available', async () => {
      const mockTokenAlert = {
        type: TokenFeatureType.BENIGN,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        feature_id: 'BENIGN_TYPE',
        description: 'This token is Benign',
      } as TokenFeature;

      const tokenAlertWithLabelIds =
        getTokenFeatureTitleDescriptionIds(mockTokenAlert);
      expect(tokenAlertWithLabelIds.titleId).toBeNull();
      expect(tokenAlertWithLabelIds.descriptionId).toBeNull();
    });
  });

  describe('fetchTxAlerts', () => {
    const mockChainId = MultichainNetworks.SOLANA;
    const mockTrade =
      'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQALEC+B/mrGX4B49j9Pt3cLS/moZQX+WeeNTFbg8tHgHtaeI3upde+TaWP4z3riqaHdNZ98/ZUKdQiAK953SSApKYw0ycVL/4j0T5DoJd6lAe/rPLCUHCHYB6gn8UZyB66MfR6MT6uJlElMjx5cEodEWykX1gxDx5qpWRYvXWAAWY0yNaBm/qy58sC4y0qyEMejJKjQYQhW8amNWJqBmVTkVv0DBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKkEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTj8b6evO+2606PWXzaqvJdDGxu+TC0vbg5HymAgNFL11htD/6J/XX9kp0wJsfKVh53ksJqzbfyd1RSzIap7OM5ejnStls42Wf0xNRAChL93gEW4UQqPNOSYySLu5vwwX4aVJh0UqsxbwO7GNdqHBaH3CjnuNams8L+PIsxs5JAZ16KD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FUGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAPPvWeGt7MppdBwkmIZQA+0op8AFkAFcDizwhodc7RDPG6lguUcBUafedbpvY415gYoZ6UmeWoc/FesM7J0/XNwJBQAFApeWAgAFAAkDriEBAAAAAAAGAgABDAIAAADadkgdAAAAAAcBAQERCBYHAAECCAkICggUEAsMERIBAhMVFgAHJOUXy5d6460qAQAAADoBZAAB2nZIHQAAAACtQU8EAAAAADIAAAcDAQAAAQkNAg4PCQD043liGeeMAAYCAAMMAgAAAAAAAAAAAAAABgIABAwCAAAATSxCAAAAAAAB6BwQxsr3h83KgxKA07LOpN5ZFYWarna+9W5g8zXGhz0EDRETDgMQEg8=';
    const mockAccountAddress = '4CT8Uuah9FCv37NfkKZaTmaJXsC9KWd7cE2btFgChmvV';

    it('should return null when security alerts API is disabled', async () => {
      process.env.SECURITY_ALERTS_API_ENABLED = 'false';

      const result = await fetchTxAlerts({
        signal,
        chainId: mockChainId,
        trade: mockTrade,
        accountAddress: mockAccountAddress,
      });

      expect(result).toBeNull();
    });

    it('should return null when security alerts API URL is not set', async () => {
      delete process.env.SECURITY_ALERTS_API_URL;

      await expect(
        fetchTxAlerts({
          signal,
          chainId: mockChainId,
          trade: mockTrade,
          accountAddress: mockAccountAddress,
        }),
      ).rejects.toThrow('Security alerts API URL is not set');
    });

    it('should return null when chain is not supported', async () => {
      const unsupportedChainId = '0x1342134' as never;

      const result = await fetchTxAlerts({
        signal,
        chainId: unsupportedChainId,
        trade: mockTrade,
        accountAddress: mockAccountAddress,
      });

      expect(result).toBeNull();
    });

    it('should make API call with correct parameters for Solana', async () => {
      const mockResponse = {
        status: 'SUCCESS',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_details: {
          code: 'ResultWithNegativeLamports',
          message: 'This is an error',
        },
        error: null,
      };

      const scope = nock(BASE_URL)
        .post('/solana/message/scan')
        .reply(200, mockResponse);

      await fetchTxAlerts({
        signal,
        chainId: mockChainId,
        trade: mockTrade,
        accountAddress: mockAccountAddress,
      });

      expect(scope.isDone()).toBe(true);
    });

    it('should return null when API returns ResultWithNegativeLamports error', async () => {
      const mockResponse = {
        status: 'SUCCESS',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_details: {
          code: 'ResultWithNegativeLamports',
          message: 'This is an error',
        },
        error: null,
      };

      nock(BASE_URL).post('/solana/message/scan').reply(200, mockResponse);

      const result = await fetchTxAlerts({
        signal,
        chainId: mockChainId,
        trade: mockTrade,
        accountAddress: mockAccountAddress,
      });

      expect(result).toBeNull();
    });

    it('should return error alert when API returns ERROR status', async () => {
      const mockResponse = {
        status: 'ERROR',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_details: {
          message: 'Insufficient balance',
          code: 'ErrorCode',
        },
        error: 'This is an error',
      };

      nock(BASE_URL).post('/solana/message/scan').reply(200, mockResponse);

      const result = await fetchTxAlerts({
        signal,
        chainId: mockChainId,
        trade: mockTrade,
        accountAddress: mockAccountAddress,
      });

      expect(result).toStrictEqual({
        titleId: 'txAlertTitle',
        description: 'The Insufficient balance.',
        descriptionId: 'bridgeSelectDifferentQuote',
      });
    });

    it('should return error alert with empty description when error_details message is missing', async () => {
      const mockResponse = {
        status: 'ERROR',
        error: null,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_details: null,
      };

      nock(BASE_URL).post('/solana/message/scan').reply(200, mockResponse);

      const result = await fetchTxAlerts({
        signal,
        chainId: mockChainId,
        trade: mockTrade,
        accountAddress: mockAccountAddress,
      });

      expect(result).toStrictEqual({
        titleId: 'txAlertTitle',
        description: '',
        descriptionId: 'bridgeSelectDifferentQuote',
      });
    });

    it('should return null when API returns successful response without errors', async () => {
      const mockResponse = {
        status: 'SUCCESS',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_details: null,
        error: null,
      };

      nock(BASE_URL).post('/solana/message/scan').reply(200, mockResponse);

      const result = await fetchTxAlerts({
        signal,
        chainId: mockChainId,
        trade: mockTrade,
        accountAddress: mockAccountAddress,
      });

      expect(result).toBeNull();
    });

    it('should throw error when API request fails', async () => {
      nock(BASE_URL).post('/solana/message/scan').reply(500);

      await expect(
        fetchTxAlerts({
          signal,
          chainId: mockChainId,
          trade: mockTrade,
          accountAddress: mockAccountAddress,
        }),
      ).rejects.toThrow(
        'Security alerts message scan request failed with status: 500',
      );
    });

    it('should work with different supported chain IDs', async () => {
      const mockResponse = {
        status: 'SUCCESS',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_details: null,
        error: null,
      };

      const scope = nock(BASE_URL)
        .post('/ethereum/message/scan')
        .reply(200, mockResponse);

      // Test with Ethereum mainnet
      await fetchTxAlerts({
        signal,
        chainId: 'eip155:1',
        trade: mockTrade,
        accountAddress: mockAccountAddress,
      });

      expect(scope.isDone()).toBe(true);
    });
  });

  describe('convertChainIdToBlockAidChainName', () => {
    it('should return correct chain name for Solana', () => {
      const result = convertChainIdToBlockAidChainName(
        MultichainNetworks.SOLANA,
      );
      expect(result).toBe('solana');
    });

    it('should return correct chain name for Ethereum mainnet', () => {
      const result = convertChainIdToBlockAidChainName('eip155:1');
      expect(result).toBe('ethereum');
    });

    it('should return null for unsupported chain', () => {
      const result = convertChainIdToBlockAidChainName(
        MultichainNetworks.SOLANA_TESTNET,
      );
      expect(result).toBeNull();
    });
  });

  describe('isSecurityAlertsAPIEnabled', () => {
    it('should return true when SECURITY_ALERTS_API_ENABLED is set to true', () => {
      process.env.SECURITY_ALERTS_API_ENABLED = 'true';
      expect(isSecurityAlertsAPIEnabled()).toBe(true);
    });

    it('should return false when SECURITY_ALERTS_API_ENABLED is set to false', () => {
      process.env.SECURITY_ALERTS_API_ENABLED = 'false';
      expect(isSecurityAlertsAPIEnabled()).toBe(false);
    });

    it('should return false when SECURITY_ALERTS_API_ENABLED is not set', () => {
      delete process.env.SECURITY_ALERTS_API_ENABLED;
      expect(isSecurityAlertsAPIEnabled()).toBe(false);
    });
  });
});
