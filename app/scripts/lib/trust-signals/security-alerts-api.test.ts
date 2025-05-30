import { scanAddress } from './security-alerts-api';
import { SupportedEVMChain, ResultType } from './types';

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';
const TEST_CHAIN = SupportedEVMChain.Ethereum;

const RESPONSE_MOCK = {
  result_type: ResultType.Benign,
  label: 'Safe address',
};

const BASE_URL = 'https://api.example.com';

describe('Security Alerts API', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    global.fetch = fetchMock;

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => RESPONSE_MOCK,
    });

    process.env.SECURITY_ALERTS_API_URL = BASE_URL;
  });

  describe('scanAddress', () => {
    it('sends POST request with correct parameters', async () => {
      const response = await scanAddress(TEST_CHAIN, TEST_ADDRESS);

      expect(response).toEqual(RESPONSE_MOCK);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/address/evm/scan`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            chain: TEST_CHAIN,
            address: TEST_ADDRESS,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
    });

    it('returns malicious result when address is flagged', async () => {
      const maliciousResponse = {
        result_type: ResultType.Malicious,
        label: 'Known scammer',
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => maliciousResponse,
      });

      const response = await scanAddress(TEST_CHAIN, TEST_ADDRESS);

      expect(response).toEqual(maliciousResponse);
    });

    it('handles different chain types', async () => {
      const polygonChain = SupportedEVMChain.Polygon;

      await scanAddress(polygonChain, TEST_ADDRESS);

      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/address/evm/scan`,
        expect.objectContaining({
          body: JSON.stringify({
            chain: polygonChain,
            address: TEST_ADDRESS,
          }),
        }),
      );
    });

    it('throws an error if fetch fails', async () => {
      const error = new Error('Network error');
      fetchMock.mockRejectedValue(error);

      await expect(scanAddress(TEST_CHAIN, TEST_ADDRESS)).rejects.toThrow(
        'Network error',
      );
    });

    it('returns error response for non-OK status', async () => {
      const errorResponse = { error: 'Server error' };

      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => errorResponse,
      });

      const response = await scanAddress(TEST_CHAIN, TEST_ADDRESS);

      expect(response).toEqual(errorResponse);
    });

    it('works when SECURITY_ALERTS_API_URL is not set', async () => {
      delete process.env.SECURITY_ALERTS_API_URL;

      await scanAddress(TEST_CHAIN, TEST_ADDRESS);

      expect(fetchMock).toHaveBeenCalledWith(
        'undefined/address/evm/scan',
        expect.any(Object),
      );
    });
  });
});
