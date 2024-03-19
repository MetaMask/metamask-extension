import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import {
  SimulationBalanceChange,
  SimulationData,
  SimulationTokenBalanceChange,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { getTokenStandardAndDetails } from '../../../store/actions';
import { getConversionRate } from '../../../ducks/metamask/metamask';
import { getTokenToFiatConversionRates } from '../../../selectors';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { Numeric } from '../../../../shared/modules/Numeric';
import { useBalanceChanges } from './useBalanceChanges';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  getTokenStandardAndDetails: jest.fn(),
}));

const mockUseSelector = useSelector as jest.Mock;
const mockGetTokenStandardAndDetails = getTokenStandardAndDetails as jest.Mock;

const TOKEN_ADDRESS_1 = '0x1111111111111111111111111111111111111111' as const;
const TOKEN_ADDRESS_2 = '0x2222222222222222222222222222222222222222' as const;
const TOKEN_ID_1 = '0x1234' as const;
const TOKEN_ID_2 = '0x5678' as const;

const dummyBalanceChange = {
  previousBalance: '0xIGNORE' as Hex,
  newBalance: '0xIGNORE' as Hex,
};

describe('useBalanceChanges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty array when simulationData is undefined', () => {
    const { result } = renderHook(() => useBalanceChanges(undefined));
    expect(result.current).toEqual({ pending: false, value: [] });
  });

  it('handles native asset balance changes correctly', () => {
    const simulationData: SimulationData = {
      nativeBalanceChange: {
        ...dummyBalanceChange,
        difference: '0x0a',
        isDecrease: true,
      },
      tokenBalanceChanges: [],
    };

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getConversionRate) {
        return 2;
      }
      return {};
    });

    const { result } = renderHook(() => useBalanceChanges(simulationData));
    expect(result.current.value).toEqual([
      {
        asset: { standard: TokenStandard.none },
        amount: {
          isNegative: true,
          quantity: '0x0a',
          decimals: 18,
          numeric: expect.any(Numeric),
        },
        fiatAmount: expect.any(Numeric),
      },
    ]);
  });

  describe('token balance changes', () => {
    const baseTokenBalanceChange: SimulationBalanceChange = {
      ...dummyBalanceChange,
      difference: '0x0a',
      isDecrease: false,
    };

    it.each([
      [
        SimulationTokenStandard.erc20,
        TOKEN_ADDRESS_1,
        undefined,
        6,
        TokenStandard.ERC20,
      ],
      [
        SimulationTokenStandard.erc721,
        TOKEN_ADDRESS_2,
        TOKEN_ID_1,
        0,
        TokenStandard.ERC721,
      ],
      [
        SimulationTokenStandard.erc1155,
        TOKEN_ADDRESS_1,
        TOKEN_ID_2,
        0,
        TokenStandard.ERC1155,
      ],
    ])(
      'handles %s token balance changes correctly',
      (standard, address, tokenId, expectedDecimals, expectedStandard) => {
        const tokenBalanceChange = {
          ...baseTokenBalanceChange,
          standard,
          address,
          id: tokenId,
        };
        const simulationData: SimulationData = {
          tokenBalanceChanges: [tokenBalanceChange],
        };

        mockUseSelector.mockImplementation((selector) => {
          if (selector === getTokenToFiatConversionRates) {
            return { [address]: 3 };
          }
          return {};
        });

        mockGetTokenStandardAndDetails.mockResolvedValue({
          decimals: expectedDecimals.toString(),
        });

        const { result } = renderHook(() => useBalanceChanges(simulationData));
        expect(result.current.value).toEqual([
          {
            asset: {
              standard: expectedStandard,
              address,
              tokenId,
            },
            amount: {
              isNegative: false,
              quantity: '0x0a',
              decimals: expectedDecimals,
              numeric: expect.any(Numeric),
            },
            fiatAmount: expect.any(Numeric),
          },
        ]);
      },
    );

    it('defaults to 18 decimals for ERC20 tokens when getTokenStandardAndDetails does not return decimals', () => {
      const tokenBalanceChange = {
        ...baseTokenBalanceChange,
        standard: SimulationTokenStandard.erc20,
        address: TOKEN_ADDRESS_1,
      };
      const simulationData: SimulationData = {
        tokenBalanceChanges: [tokenBalanceChange],
      };

      mockUseSelector.mockImplementation((selector) => {
        if (selector === getTokenToFiatConversionRates) {
          return { [TOKEN_ADDRESS_1]: 3 };
        }
        return {};
      });

      mockGetTokenStandardAndDetails.mockResolvedValue({});

      const { result } = renderHook(() => useBalanceChanges(simulationData));
      expect(result.current.value[0].amount.decimals).toBe(18);
    });

    it('returns FIAT_UNAVAILABLE when fiat conversion rate is not available', () => {
      const tokenBalanceChange = {
        ...baseTokenBalanceChange,
        standard: SimulationTokenStandard.erc20,
        address: TOKEN_ADDRESS_1,
      };
      const simulationData: SimulationData = {
        tokenBalanceChanges: [tokenBalanceChange],
      };

      mockUseSelector.mockImplementation((selector) => {
        if (selector === getTokenToFiatConversionRates) {
          return {};
        }
        return {};
      });

      mockGetTokenStandardAndDetails.mockResolvedValue({ decimals: '6' });

      const { result } = renderHook(() => useBalanceChanges(simulationData));
      expect(result.current.value[0].fiatAmount).toBe('FIAT_UNAVAILABLE');
    });
  });

  it('returns pending state while fetching ERC20 token decimals', () => {
    const tokenBalanceChange: SimulationTokenBalanceChange = {
      ...dummyBalanceChange,
      difference: '0x0a',
      isDecrease: false,
      standard: SimulationTokenStandard.erc20,
      address: TOKEN_ADDRESS_1,
    };
    const simulationData: SimulationData = {
      tokenBalanceChanges: [tokenBalanceChange],
    };

    mockGetTokenStandardAndDetails.mockImplementation(async () => ({}));

    const { result } = renderHook(() => useBalanceChanges(simulationData));
    expect(result.current).toEqual({ pending: true, value: [] });
  });
});
