import { Hex } from '@metamask/utils';
import { renderHook } from '@testing-library/react-hooks';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { getConversionRate } from '../../../ducks/metamask/metamask';
import { getTokenToFiatConversionRates } from '../../../selectors';
import { getTokenStandardAndDetails } from '../../../store/actions';
import { Numeric } from '../../../../shared/modules/Numeric';
import { useBalanceChanges } from './useBalanceChanges';
import {
  SimulationData,
  SimulationTokenStandard,
} from './ERASEME-core-simulation-types';
import { FIAT_UNAVAILABLE } from './types';

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../../../ducks/metamask/metamask', () => ({
  getConversionRate: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  getTokenToFiatConversionRates: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  getTokenStandardAndDetails: jest.fn(),
}));

const mockGetConversionRate = getConversionRate as jest.Mock;
const mockGetTokenToFiatConversionRates =
  getTokenToFiatConversionRates as unknown as jest.Mock;
const mockGetTokenStandardAndDetails = getTokenStandardAndDetails as jest.Mock;

const TOKEN_ADDRESS_1_MOCK: Hex = '0x1';
const TOKEN_ADDRESS_2_MOCK: Hex = '0x2';
const TOKEN_ID_1_MOCK: Hex = '0x123';
const DIFFERENCE_1: Hex = '0x1';
const DIFFERENCE_2: Hex = '0x2';

const dummyBalanceChange = {
  previousBalance: '0xIGNORE' as Hex,
  newBalance: '0xIGNORE' as Hex,
};

describe('useBalanceChanges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConversionRate.mockReturnValue(1);
    mockGetTokenToFiatConversionRates.mockReturnValue({});
    mockGetTokenStandardAndDetails.mockResolvedValue({});
  });

  it('returns empty array when no simulation data', () => {
    const { result } = renderHook(() => useBalanceChanges(undefined));
    expect(result.current).toEqual({ pending: false, value: [] });
  });

  it('returns pending state when fetching token details', async () => {
    const simulationData: SimulationData = {
      nativeBalanceChange: undefined,
      tokenBalanceChanges: [
        {
          ...dummyBalanceChange,
          difference: DIFFERENCE_1,
          isDecrease: true,
          address: TOKEN_ADDRESS_1_MOCK,
          standard: SimulationTokenStandard.erc20,
        },
      ],
    };
    const { result, unmount } = renderHook(() =>
      useBalanceChanges(simulationData),
    );
    expect(result.current).toEqual({ pending: true, value: [] });
    unmount();
  });

  describe('with token balance changes', () => {
    const setupHook = (
      tokenBalanceChanges: SimulationData['tokenBalanceChanges'],
    ) => {
      const simulationData: SimulationData = {
        nativeBalanceChange: undefined,
        tokenBalanceChanges,
      };
      return renderHook(() => useBalanceChanges(simulationData));
    };

    it('maps token balance changes correctly', async () => {
      mockGetTokenStandardAndDetails.mockResolvedValue({ decimals: '10' });
      mockGetTokenToFiatConversionRates.mockReturnValue({
        [TOKEN_ADDRESS_1_MOCK]: 0.5,
      });

      const { result, waitForNextUpdate } = setupHook([
        {
          ...dummyBalanceChange,
          difference: DIFFERENCE_1,
          isDecrease: true,
          address: TOKEN_ADDRESS_1_MOCK,
          standard: SimulationTokenStandard.erc20,
        },
      ]);

      await waitForNextUpdate();

      expect(result.current.value).toEqual([
        {
          asset: {
            address: TOKEN_ADDRESS_1_MOCK,
            standard: TokenStandard.ERC20,
          },
          amount: {
            isNegative: true,
            quantity: DIFFERENCE_1,
            decimals: 10,
            numeric: expect.any(Numeric),
          },
          fiatAmount: expect.any(Numeric),
        },
      ]);
      const changes = result.current.value;
      expect(changes[0].amount.numeric.toString()).toBe('-0.0000000001');
      expect(changes[0].fiatAmount.toString()).toBe('-0.00000000005');
    });

    it('handles multiple token balance changes', async () => {
      const decimalMap: Record<Hex, number> = {
        [TOKEN_ADDRESS_1_MOCK]: 3,
        [TOKEN_ADDRESS_2_MOCK]: 4,
      };
      mockGetTokenStandardAndDetails.mockImplementation((address: Hex) =>
        Promise.resolve({ decimals: decimalMap[address].toString() }),
      );
      mockGetTokenToFiatConversionRates.mockReturnValue({
        [TOKEN_ADDRESS_1_MOCK]: 0.5,
        [TOKEN_ADDRESS_2_MOCK]: 2,
      });

      const { result, waitForNextUpdate } = setupHook([
        {
          ...dummyBalanceChange,
          difference: DIFFERENCE_1,
          isDecrease: true,
          address: TOKEN_ADDRESS_1_MOCK,
          standard: SimulationTokenStandard.erc20,
        },
        {
          ...dummyBalanceChange,
          difference: DIFFERENCE_2,
          isDecrease: false,
          address: TOKEN_ADDRESS_2_MOCK,
          standard: SimulationTokenStandard.erc20,
        },
      ]);

      await waitForNextUpdate();

      const changes = result.current.value;
      expect(changes).toHaveLength(2);
      expect(changes[0].amount.numeric.toString()).toBe('-0.001');
      expect(changes[0].fiatAmount.toString()).toBe('-0.0005');
      expect(changes[1].amount.numeric.toString()).toBe('0.0002');
      expect(changes[1].fiatAmount.toString()).toBe('0.0004');
    });

    it('handles non-ERC20 tokens', async () => {
      const { result, waitForNextUpdate } = setupHook([
        {
          ...dummyBalanceChange,
          difference: DIFFERENCE_1,
          isDecrease: true,
          address: TOKEN_ADDRESS_1_MOCK,
          standard: SimulationTokenStandard.erc721,
          id: TOKEN_ID_1_MOCK,
        },
      ]);

      await waitForNextUpdate();

      expect(result.current.value).toEqual([
        {
          asset: {
            address: TOKEN_ADDRESS_1_MOCK,
            standard: TokenStandard.ERC721,
            tokenId: TOKEN_ID_1_MOCK,
          },
          amount: {
            isNegative: true,
            quantity: DIFFERENCE_1,
            decimals: 0,
            numeric: expect.any(Numeric),
          },
          fiatAmount: FIAT_UNAVAILABLE,
        },
      ]);
    });

    it('uses default decimals when token details not found', async () => {
      const { result, waitForNextUpdate } = setupHook([
        {
          ...dummyBalanceChange,
          difference: DIFFERENCE_1,
          isDecrease: true,
          address: TOKEN_ADDRESS_1_MOCK,
          standard: SimulationTokenStandard.erc20,
        },
      ]);

      await waitForNextUpdate();

      expect(result.current.value[0].amount.decimals).toBe(18);
    });
  });

  describe('with native balance change', () => {
    const setupHook = (
      nativeBalanceChange?: SimulationData['nativeBalanceChange'],
    ) => {
      const simulationData: SimulationData = {
        nativeBalanceChange,
        tokenBalanceChanges: [],
      };
      return renderHook(() => useBalanceChanges(simulationData));
    };

    it('maps native balance change correctly', async () => {
      mockGetConversionRate.mockReturnValue(2);

      const { result, waitForNextUpdate } = setupHook({
        ...dummyBalanceChange,
        difference: DIFFERENCE_1,
        isDecrease: true,
      });

      await waitForNextUpdate();

      expect(result.current.value).toEqual([
        {
          asset: {
            standard: TokenStandard.none,
          },
          amount: {
            isNegative: true,
            quantity: DIFFERENCE_1,
            decimals: 18,
            numeric: expect.any(Numeric),
          },
          fiatAmount: expect.any(Numeric),
        },
      ]);
      expect(result.current.value[0].amount.numeric.toString()).toBe(
        '-0.000000000000000001',
      );
      expect(result.current.value[0].fiatAmount.toString()).toBe(
        '-0.000000000000000002',
      );
    });

    it('handles no native balance change', async () => {
      const { result, waitForNextUpdate } = setupHook(undefined);
      await waitForNextUpdate();
      expect(result.current.value).toEqual([]);
    });
  });

  it('combines native and token balance changes', async () => {
    mockGetTokenStandardAndDetails.mockResolvedValue({ decimals: '10' });
    mockGetConversionRate.mockReturnValue(2);
    mockGetTokenToFiatConversionRates.mockReturnValue({
      [TOKEN_ADDRESS_1_MOCK]: 0.5,
    });

    const simulationData: SimulationData = {
      nativeBalanceChange: {
        ...dummyBalanceChange,
        difference: DIFFERENCE_1,
        isDecrease: true,
      },
      tokenBalanceChanges: [
        {
          ...dummyBalanceChange,
          difference: DIFFERENCE_2,
          isDecrease: false,
          address: TOKEN_ADDRESS_1_MOCK,
          standard: SimulationTokenStandard.erc20,
        },
      ],
    };
    const { result, waitForNextUpdate } = renderHook(() =>
      useBalanceChanges(simulationData),
    );

    await waitForNextUpdate();

    expect(result.current.value).toHaveLength(2);
    expect(result.current.value[0].asset).toEqual({
      standard: TokenStandard.none,
    });
    expect(result.current.value[0].amount.numeric.toString()).toBe(
      '-0.000000000000000001',
    );
    expect(result.current.value[0].fiatAmount.toString()).toBe(
      '-0.000000000000000002',
    );
    expect(result.current.value[1].asset).toEqual({
      address: TOKEN_ADDRESS_1_MOCK,
      standard: TokenStandard.ERC20,
    });
    expect(result.current.value[1].amount.numeric.toString()).toBe(
      '0.0000000002',
    );
    expect(result.current.value[1].fiatAmount.toString()).toBe('0.0000000001');
  });
});
