import { BigNumber } from 'bignumber.js';

import { getTokenStandardAndDetailsByChain } from '../../../store/actions';
import { ERC20_DEFAULT_DECIMALS } from '../constants/token';
import {
  calculateTokenAmount,
  fetchAllErc20Decimals,
  fetchAllTokenDetails,
  fetchErc20Decimals,
  getTokenValueFromRecord,
  memoizedGetTokenStandardAndDetailsByChain,
} from './token';

const MOCK_ADDRESS = '0x514910771af9ca656af840dff83e8264ecf986ca';
const MOCK_ADDRESS_2 = '0x514910771af9ca656af840dff83e8264ecf986cb';
const MOCK_DECIMALS = 36;
const MOCK_CHAIN_ID = '0x1';

jest.mock('../../../store/actions', () => ({
  getTokenStandardAndDetailsByChain: jest.fn(),
}));

describe('fetchErc20Decimals', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it(`should return the default number, ${ERC20_DEFAULT_DECIMALS}, if no decimals were found from details`, async () => {
    (getTokenStandardAndDetailsByChain as jest.Mock).mockResolvedValue({});
    const decimals = await fetchErc20Decimals(MOCK_ADDRESS);

    expect(decimals).toBe(ERC20_DEFAULT_DECIMALS);
  });

  it('should return the decimals for a given token address', async () => {
    (getTokenStandardAndDetailsByChain as jest.Mock).mockResolvedValue({
      decimals: MOCK_DECIMALS,
    });
    const decimals = await fetchErc20Decimals(MOCK_ADDRESS);

    expect(decimals).toBe(MOCK_DECIMALS);
  });

  it('should memoize the result for the same token addresses', async () => {
    (getTokenStandardAndDetailsByChain as jest.Mock).mockResolvedValue({
      decimals: MOCK_DECIMALS,
    });

    const firstCallResult = await fetchErc20Decimals(MOCK_ADDRESS);
    const secondCallResult = await fetchErc20Decimals(MOCK_ADDRESS);

    expect(firstCallResult).toBe(secondCallResult);
    expect(getTokenStandardAndDetailsByChain).toHaveBeenCalledTimes(2);

    await fetchErc20Decimals('0xDifferentAddress');
    expect(getTokenStandardAndDetailsByChain).toHaveBeenCalledTimes(3);
  });
});

describe('memoizedGetTokenStandardAndDetailsByChain', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the memoization cache by resetting the module
    memoizedGetTokenStandardAndDetailsByChain.cache.clear?.();
  });

  it('should return empty object if no token address is provided', async () => {
    const result = await memoizedGetTokenStandardAndDetailsByChain(undefined);
    expect(result).toEqual({});
    expect(getTokenStandardAndDetailsByChain).not.toHaveBeenCalled();
  });

  it('should return token details for a given token address and chainId', async () => {
    const mockDetails = {
      decimals: '6',
      standard: 'ERC20',
      symbol: 'USDC',
    };
    (getTokenStandardAndDetailsByChain as jest.Mock).mockResolvedValue(
      mockDetails,
    );

    const result = await memoizedGetTokenStandardAndDetailsByChain(
      MOCK_ADDRESS,
      MOCK_CHAIN_ID,
    );

    expect(result).toEqual(mockDetails);
    expect(getTokenStandardAndDetailsByChain).toHaveBeenCalledWith(
      MOCK_ADDRESS,
      undefined,
      undefined,
      MOCK_CHAIN_ID,
    );
  });

  it('should use different cache entries for same address on different chains', async () => {
    const mockDetailsChain1 = { decimals: '6', standard: 'ERC20' };
    const mockDetailsChain2 = { decimals: '18', standard: 'ERC20' };

    (getTokenStandardAndDetailsByChain as jest.Mock)
      .mockResolvedValueOnce(mockDetailsChain1)
      .mockResolvedValueOnce(mockDetailsChain2);

    const result1 = await memoizedGetTokenStandardAndDetailsByChain(
      MOCK_ADDRESS,
      '0x1',
    );
    const result2 = await memoizedGetTokenStandardAndDetailsByChain(
      MOCK_ADDRESS,
      '0x38',
    );

    expect(result1).toEqual(mockDetailsChain1);
    expect(result2).toEqual(mockDetailsChain2);
    expect(getTokenStandardAndDetailsByChain).toHaveBeenCalledTimes(2);
  });

  it('should return empty object when getTokenStandardAndDetailsByChain throws', async () => {
    (getTokenStandardAndDetailsByChain as jest.Mock).mockRejectedValue(
      new Error('Network error'),
    );

    const result = await memoizedGetTokenStandardAndDetailsByChain(
      MOCK_ADDRESS,
      MOCK_CHAIN_ID,
    );

    expect(result).toEqual({});
  });
});

describe('fetchAllErc20Decimals', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it(`call fetchErc20Decimals for all tokens passed`, async () => {
    (getTokenStandardAndDetailsByChain as jest.Mock).mockResolvedValue({});
    const response = await fetchAllErc20Decimals(
      [MOCK_ADDRESS, MOCK_ADDRESS_2],
      MOCK_CHAIN_ID,
    );

    expect(response).toEqual({
      [MOCK_ADDRESS]: ERC20_DEFAULT_DECIMALS,
      [MOCK_ADDRESS_2]: ERC20_DEFAULT_DECIMALS,
    });
  });
});

describe('fetchAllTokenDetails', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it(`call getTokenStandardAndDetailsByChain for all tokens passed`, async () => {
    (getTokenStandardAndDetailsByChain as jest.Mock).mockResolvedValue({
      standard: 'erc20',
      tokenURI: 'https://token.com',
      symbol: 'USDC',
      name: 'USDC',
      decimals: '6',
      balance: '1000000000000000000',
    });
    const response = await fetchAllTokenDetails([MOCK_ADDRESS], MOCK_CHAIN_ID);

    expect(response).toEqual({
      [MOCK_ADDRESS]: {
        standard: 'erc20',
        tokenURI: 'https://token.com',
        symbol: 'USDC',
        name: 'USDC',
        decimals: '6',
        balance: '1000000000000000000',
      },
    });
  });
});

describe('calculateTokenAmount', () => {
  it('returns the correct token amount', () => {
    expect(calculateTokenAmount('1000000000000000000', 18)).toEqual(
      new BigNumber('1'),
    );
    expect(calculateTokenAmount('0xB1A2BC2EC50000', 10, 16)).toEqual(
      new BigNumber('5000000'),
    );
    expect(calculateTokenAmount('0xB1A2BC2EC50000', 10, 16, 2)).toEqual(
      new BigNumber('10000000'),
    );
  });
});

describe('getTokenValueFromRecord', () => {
  it('returns the correct value for token address', () => {
    const result = getTokenValueFromRecord(
      {
        '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 6,
        '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 6,
        '0x0000000000000000000000000000000000000000': 18,
      },
      '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    );
    expect(result).toEqual(6);
  });

  it('returns undefined if record is not found', () => {
    const result = getTokenValueFromRecord(
      {
        '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 6,
        '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 6,
        '0x0000000000000000000000000000000000000000': 18,
      },
      '0x123',
    );
    expect(result).toEqual(undefined);
  });
});
