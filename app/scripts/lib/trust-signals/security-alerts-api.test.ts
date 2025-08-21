import nock from 'nock';
import { SECOND } from '../../../../shared/constants/time';
import { scanAddress, scanAddressAndAddToCache } from './security-alerts-api';
import { SupportedEVMChain, ResultType } from './types';

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';
const TEST_CHAIN = SupportedEVMChain.Ethereum;

const RESPONSE_MOCK = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
    let getAddressSecurityAlertResponseMock: jest.Mock;
    let addAddressSecurityAlertResponseMock: jest.Mock;

    beforeEach(() => {
      getAddressSecurityAlertResponseMock = jest.fn();
      addAddressSecurityAlertResponseMock = jest.fn();
    });

    it('should return cached response when available', async () => {
      const cachedResponse = {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_type: ResultType.Benign,
        label: 'Cached safe address',
      };
      getAddressSecurityAlertResponseMock.mockReturnValue(cachedResponse);

      const result = await scanAddressAndAddToCache(
        TEST_ADDRESS,
        getAddressSecurityAlertResponseMock,
        addAddressSecurityAlertResponseMock,
        SupportedEVMChain.Ethereum,
      );

      expect(result).toEqual(cachedResponse);
      expect(getAddressSecurityAlertResponseMock).toHaveBeenCalledWith(
        TEST_ADDRESS,
      );
      expect(addAddressSecurityAlertResponseMock).not.toHaveBeenCalled();
    });

    it('should scan address and cache result when not cached', async () => {
      getAddressSecurityAlertResponseMock.mockReturnValue(undefined);

      const scope = nock(BASE_URL)
        .post('/address/evm/scan', {
          chain: SupportedEVMChain.Ethereum,
          address: TEST_ADDRESS,
        })
        .reply(200, RESPONSE_MOCK);

      const result = await scanAddressAndAddToCache(
        TEST_ADDRESS,
        getAddressSecurityAlertResponseMock,
        addAddressSecurityAlertResponseMock,
        SupportedEVMChain.Ethereum,
      );

      expect(result).toEqual(RESPONSE_MOCK);
      expect(getAddressSecurityAlertResponseMock).toHaveBeenCalledWith(
        TEST_ADDRESS,
      );
      expect(addAddressSecurityAlertResponseMock).toHaveBeenCalledWith(
        TEST_ADDRESS,
        RESPONSE_MOCK,
      );
      expect(scope.isDone()).toBe(true);
    });

    it('throw error when scan fails', async () => {
      getAddressSecurityAlertResponseMock.mockReturnValue(undefined);

      nock(BASE_URL).post('/address/evm/scan').replyWithError('Network error');

      await expect(
        scanAddressAndAddToCache(
          TEST_ADDRESS,
          getAddressSecurityAlertResponseMock,
          addAddressSecurityAlertResponseMock,
          SupportedEVMChain.Ethereum,
        ),
      ).rejects.toThrow('Network error');

      expect(getAddressSecurityAlertResponseMock).toHaveBeenCalledWith(
        TEST_ADDRESS,
      );
      expect(addAddressSecurityAlertResponseMock).not.toHaveBeenCalled();
    });
  });
});
