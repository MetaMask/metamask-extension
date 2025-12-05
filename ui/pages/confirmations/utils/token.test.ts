import { BigNumber } from 'bignumber.js';

import { getTokenStandardAndDetailsByChain } from '../../../store/actions';
import { ERC20_DEFAULT_DECIMALS } from '../constants/token';
import {
  calculateTokenAmount,
  fetchAllErc20Decimals,
  fetchAllTokenDetails,
  fetchErc20Decimals,
  getTokenValueFromRecord,
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

  it('handles conversion rates with more than 15 significant digits', () => {
    // Conversion rates from price APIs can have 16+ significant digits
    // which would cause BigNumber to throw if passed as a number type
    const highPrecisionRate = 3145.037142758881;

    expect(() =>
      calculateTokenAmount('1000000000000000000', 18, 10, highPrecisionRate),
    ).not.toThrow();

    const result = calculateTokenAmount(
      '1000000000000000000',
      18,
      10,
      highPrecisionRate,
    );
    expect(result.toNumber()).toBeCloseTo(highPrecisionRate, 10);
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
