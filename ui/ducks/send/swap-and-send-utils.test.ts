import {
  SWAPS_API_V2_BASE_URL,
  SWAPS_CLIENT_ID,
  SWAPS_DEV_API_V2_BASE_URL,
} from '../../../shared/constants/swaps';
import { SECOND } from '../../../shared/constants/time';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { validateData } from '../../../shared/lib/swaps-utils';
import {
  type Request as APIRequest,
  getSwapAndSendQuotes,
} from './swap-and-send-utils';

jest.mock('../../../shared/lib/fetch-with-cache');
jest.mock('../../../shared/lib/swaps-utils', () => ({
  ...jest.requireActual('../../../shared/lib/swaps-utils'),
  validateData: jest.fn(),
}));

const BASE_URL = process.env.SWAPS_USE_DEV_APIS
  ? SWAPS_DEV_API_V2_BASE_URL
  : SWAPS_API_V2_BASE_URL;

describe('getSwapAndSendQuotes', () => {
  const mockRequest: APIRequest = {
    chainId: 1,
    sourceAmount: '1000000000000000000',
    sourceToken: '0xToken1',
    destinationToken: '0xToken2',
    sender: '0xSender',
    recipient: '0xRecipient',
  };

  const mockResponse = [
    {
      gasParams: { maxGas: 21000 },
      trade: {
        data: '123123123',
        to: '1232312213',
        from: '12312312312312',
        value: '1000000000000000000',
      },
      approvalNeeded: {
        data: '123123123',
        to: '123123',
        from: '1232',
        value: '1000000000000000000',
      },
      sourceAmount: '1000000000000000000',
      destinationAmount: '2000000000000000000',
      sourceToken: '0xToken1',
      destinationToken: '0xToken2',
      sender: '0xSender',
      recipient: '0xRecipient',
      aggregator: 'aggregator',
      aggregatorType: 'type',
      error: null,
      fee: 0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (fetchWithCache as jest.Mock).mockResolvedValue(mockResponse);
  });

  it('should fetch quotes and return the correct data structure', async () => {
    (validateData as jest.Mock).mockReturnValueOnce(true);

    const quotes = await getSwapAndSendQuotes(mockRequest);

    expect(fetchWithCache).toHaveBeenCalledWith({
      url: expect.stringContaining(`${BASE_URL}/v2/networks/1/quotes`),
      fetchOptions: {
        method: 'GET',
        headers: { 'X-Client-Id': SWAPS_CLIENT_ID },
      },
      cacheOptions: { cacheRefreshTime: 0, timeout: SECOND * 15 },
      functionName: 'getSwapAndSendQuotes',
    });

    expect(quotes).toEqual([
      {
        ...mockResponse[0],
        slippage: '2',
        trade: {
          data: '0x123123123',
          from: '0x12312312312312',
          to: '0x1232312213',
          value: '0xde0b6b3a7640000', // 1 ether in hex
          gas: '0x5208', // 21000 in hex
        },
        approvalNeeded: {
          data: '0x123123123',
          to: '0x123123',
          from: '0x1232',
          value: '0x1000000000000000000',
        },
      },
    ]);
  });

  it('should filter out invalid quotes', async () => {
    (validateData as jest.Mock).mockReturnValue(false);

    const quotes = await getSwapAndSendQuotes(mockRequest);

    expect(quotes).toEqual([]);
  });

  it('should handle errors in fetchWithCache gracefully', async () => {
    (fetchWithCache as jest.Mock).mockRejectedValue(new Error('Network Error'));

    await expect(getSwapAndSendQuotes(mockRequest)).rejects.toThrow(
      'Network Error',
    );
  });
});
