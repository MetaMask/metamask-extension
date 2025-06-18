import nock from 'nock';
import { SECOND } from '../../../../shared/constants/time';
import { scanAddress, scanAddressAndAddToCache } from './security-alerts-api';
import { SupportedEVMChain, ResultType } from './types';
import * as trustSignalsUtil from './trust-signals-util';

jest.mock('./trust-signals-util');

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';
const TEST_CHAIN = SupportedEVMChain.Ethereum;

const RESPONSE_MOCK = {
  result_type: ResultType.Benign,
  label: 'Safe address',
};

const BASE_URL = 'https://api.example.com';

describe('Security Alerts API', () => {
  beforeEach(() => {
    nock.cleanAll();
    process.env.SECURITY_ALERTS_API_URL = BASE_URL;
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('scanAddress', () => {
    it('sends POST request with correct parameters', async () => {
      const scope = nock(BASE_URL)
        .post('/address/evm/scan', {
          chain: TEST_CHAIN,
          address: TEST_ADDRESS,
        })
        .reply(200, RESPONSE_MOCK);

      const response = await scanAddress(TEST_CHAIN, TEST_ADDRESS);

      expect(response).toEqual(RESPONSE_MOCK);
      expect(scope.isDone()).toBe(true);
    });

    it('returns malicious result when address is flagged', async () => {
      const maliciousResponse = {
        result_type: ResultType.Malicious,
        label: 'Known scammer',
      };

      const scope = nock(BASE_URL)
        .post('/address/evm/scan')
        .reply(200, maliciousResponse);

      const response = await scanAddress(TEST_CHAIN, TEST_ADDRESS);

      expect(response).toEqual(maliciousResponse);
      expect(scope.isDone()).toBe(true);
    });

    it('handles different chain types', async () => {
      const polygonChain = SupportedEVMChain.Polygon;

      const scope = nock(BASE_URL)
        .post('/address/evm/scan', {
          chain: polygonChain,
          address: TEST_ADDRESS,
        })
        .reply(200, RESPONSE_MOCK);

      await scanAddress(polygonChain, TEST_ADDRESS);

      expect(scope.isDone()).toBe(true);
    });

    it('throws an error if fetch fails', async () => {
      nock(BASE_URL).post('/address/evm/scan').replyWithError('Network error');

      await expect(scanAddress(TEST_CHAIN, TEST_ADDRESS)).rejects.toThrow(
        'Network error',
      );
    });

    it('returns error response for non-OK status', async () => {
      const errorResponse = { error: 'Server error' };

      nock(BASE_URL).post('/address/evm/scan').reply(500, errorResponse);

      const response = await scanAddress(TEST_CHAIN, TEST_ADDRESS);

      expect(response).toEqual(errorResponse);
    });

    it('times out after 5 seconds', async () => {
      nock(BASE_URL)
        .post('/address/evm/scan')
        .delay(SECOND * 6)
        .reply(200, RESPONSE_MOCK);

      await expect(scanAddress(TEST_CHAIN, TEST_ADDRESS)).rejects.toThrow(
        'The user aborted a request.',
      );
    });
  });

  describe('scanAddressAndAddToCache', () => {
    let mockAppStateController: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    let mockNetworkController: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const mockedGetChainId = jest.mocked(trustSignalsUtil.getChainId);

    beforeEach(() => {
      mockAppStateController = {
        getAddressSecurityAlertResponse: jest.fn(),
        addAddressSecurityAlertResponse: jest.fn(),
      };

      mockNetworkController = {
        state: {
          providerConfig: {
            chainId: '0x1', // Ethereum mainnet
          },
        },
      };

      // Default mock for getChainId
      mockedGetChainId.mockReturnValue(SupportedEVMChain.Ethereum);
    });

    it('should return cached response when available', async () => {
      const cachedResponse = {
        result_type: ResultType.Benign,
        label: 'Cached safe address',
      };
      mockAppStateController.getAddressSecurityAlertResponse.mockReturnValue(
        cachedResponse,
      );

      const result = await scanAddressAndAddToCache(
        TEST_ADDRESS,
        mockAppStateController,
        mockNetworkController,
      );

      expect(result).toEqual(cachedResponse);
      expect(
        mockAppStateController.getAddressSecurityAlertResponse,
      ).toHaveBeenCalledWith(TEST_ADDRESS);
      expect(
        mockAppStateController.addAddressSecurityAlertResponse,
      ).not.toHaveBeenCalled();
      expect(mockedGetChainId).not.toHaveBeenCalled();
    });

    it('should scan address and cache result when not cached', async () => {
      mockAppStateController.getAddressSecurityAlertResponse.mockReturnValue(
        undefined,
      );

      const scope = nock(BASE_URL)
        .post('/address/evm/scan', {
          chain: SupportedEVMChain.Ethereum,
          address: TEST_ADDRESS,
        })
        .reply(200, RESPONSE_MOCK);

      const result = await scanAddressAndAddToCache(
        TEST_ADDRESS,
        mockAppStateController,
        mockNetworkController,
      );

      expect(result).toEqual(RESPONSE_MOCK);
      expect(
        mockAppStateController.getAddressSecurityAlertResponse,
      ).toHaveBeenCalledWith(TEST_ADDRESS);
      expect(mockedGetChainId).toHaveBeenCalledWith(mockNetworkController);
      expect(
        mockAppStateController.addAddressSecurityAlertResponse,
      ).toHaveBeenCalledWith(TEST_ADDRESS, RESPONSE_MOCK);
      expect(scope.isDone()).toBe(true);
    });

    it('should handle different chain IDs correctly', async () => {
      mockAppStateController.getAddressSecurityAlertResponse.mockReturnValue(
        undefined,
      );
      mockedGetChainId.mockReturnValue(SupportedEVMChain.Polygon);

      const scope = nock(BASE_URL)
        .post('/address/evm/scan', {
          chain: SupportedEVMChain.Polygon,
          address: TEST_ADDRESS,
        })
        .reply(200, RESPONSE_MOCK);

      const result = await scanAddressAndAddToCache(
        TEST_ADDRESS,
        mockAppStateController,
        mockNetworkController,
      );

      expect(result).toEqual(RESPONSE_MOCK);
      expect(mockedGetChainId).toHaveBeenCalledWith(mockNetworkController);
      expect(
        mockAppStateController.addAddressSecurityAlertResponse,
      ).toHaveBeenCalledWith(TEST_ADDRESS, RESPONSE_MOCK);
      expect(scope.isDone()).toBe(true);
    });

    it('should throw error when chain ID is not found', async () => {
      mockAppStateController.getAddressSecurityAlertResponse.mockReturnValue(
        undefined,
      );
      mockedGetChainId.mockImplementation(() => {
        throw new Error('Chain ID not found');
      });

      await expect(
        scanAddressAndAddToCache(
          TEST_ADDRESS,
          mockAppStateController,
          mockNetworkController,
        ),
      ).rejects.toThrow('Chain ID not found');

      expect(
        mockAppStateController.getAddressSecurityAlertResponse,
      ).toHaveBeenCalledWith(TEST_ADDRESS);
      expect(mockedGetChainId).toHaveBeenCalledWith(mockNetworkController);
      expect(
        mockAppStateController.addAddressSecurityAlertResponse,
      ).not.toHaveBeenCalled();
    });

    it('should not cache result when scan fails', async () => {
      mockAppStateController.getAddressSecurityAlertResponse.mockReturnValue(
        undefined,
      );

      nock(BASE_URL).post('/address/evm/scan').replyWithError('Network error');

      await expect(
        scanAddressAndAddToCache(
          TEST_ADDRESS,
          mockAppStateController,
          mockNetworkController,
        ),
      ).rejects.toThrow('Network error');

      expect(
        mockAppStateController.getAddressSecurityAlertResponse,
      ).toHaveBeenCalledWith(TEST_ADDRESS);
      expect(mockedGetChainId).toHaveBeenCalledWith(mockNetworkController);
      expect(
        mockAppStateController.addAddressSecurityAlertResponse,
      ).not.toHaveBeenCalled();
    });
  });
});
