import { getTokenStandardAndDetailsByChain } from '../../../store/actions';
import { ERC20_DEFAULT_DECIMALS } from '../constants/token';
import { fetchErc20Decimals } from './token';

const MOCK_ADDRESS = '0x514910771af9ca656af840dff83e8264ecf986ca';
const MOCK_DECIMALS = 36;

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
