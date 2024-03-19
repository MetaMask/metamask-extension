import { renderHook } from '@testing-library/react-hooks';
import { Hex } from '@metamask/utils';
import {
  SimulationData,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import { getTokenStandardAndDetails } from '../../../store/actions';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import { useBalanceChanges } from './useBalanceChanges';
import { BalanceChange } from './types';

jest.mock('../../../store/actions', () => ({
  getTokenStandardAndDetails: jest.fn(),
}));

const mockGetTokenStandardAndDetails = getTokenStandardAndDetails as jest.Mock;

const TOKEN_ADDRESS_1_MOCK =
  '0x1234567890123456789012345678901234567890' as Hex;
const TOKEN_ADDRESS_2_MOCK =
  '0x0987654321098765432109876543210987654321' as Hex;
const TOKEN_ID_1_MOCK = '0x1234' as Hex;
const TOKEN_ID_2_MOCK = '0x5678' as Hex;

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

  it('correctly converts native balance change and verifies absChange', async () => {
    const simulationData: SimulationData = {
      nativeBalanceChange: {
        ...dummyBalanceChange,
        difference: '0x1234',
        isDecrease: true,
      },
      tokenBalanceChanges: [],
    };
    const { result, waitForNextUpdate } = renderHook(() =>
      useBalanceChanges(simulationData),
    );
    await waitForNextUpdate();
    expect(result.current.value).toEqual([
      {
        asset: { isNative: true },
        isDecrease: true,
        absChange: new Numeric('0x1234', 16, EtherDenomination.WEI),
      },
    ]);
  });

  it.each([
    {
      standard: SimulationTokenStandard.erc20,
      difference: '0x12',
      decimals: undefined, // Defaults to 18
      expectedAbsChange: '0.000000000000000018',
    },
    {
      standard: SimulationTokenStandard.erc20,
      difference: '0x12',
      decimals: 10,
      expectedAbsChange: '0.0000000018',
    },
    {
      standard: SimulationTokenStandard.erc721,
      tokenId: TOKEN_ID_1_MOCK,
      expectedAbsChange: '1',
    },
    {
      standard: SimulationTokenStandard.erc1155,
      tokenId: TOKEN_ID_1_MOCK,
      difference: '0x12',
      expectedAbsChange: '18',
    },
  ])(
    'correctly converts $standard token balance change with decimals $decimals and verifies absChange',
    async ({ standard, tokenId, difference, decimals, expectedAbsChange }) => {
      mockGetTokenStandardAndDetails.mockResolvedValueOnce({ decimals });

      const simulationData = {
        tokenBalanceChanges: [
          {
            ...dummyBalanceChange,
            standard,
            address: TOKEN_ADDRESS_1_MOCK,
            id: tokenId,
            difference: difference as Hex,
            isDecrease: true,
          },
        ],
      };
      const { result, waitForNextUpdate } = renderHook(() =>
        useBalanceChanges(simulationData),
      );
      await waitForNextUpdate();
      expect(result.current.value).toHaveLength(1);
      const balanceChanges = result.current.value as BalanceChange[];
      expect(balanceChanges[0].asset).toEqual({
        isNative: false,
        standard,
        address: TOKEN_ADDRESS_1_MOCK,
        tokenId,
      });
      expect(balanceChanges[0].amount.isNegative).toBe(true);
      expect(
        Numeric.from(balanceChanges[0].amount.quantity, 16)
          .toBase(10)
          .toString(),
      ).toBe(expectedAbsChange);
    },
  );

  it('fetches token details for unique erc20 token addresses', async () => {
    mockGetTokenStandardAndDetails
      .mockResolvedValueOnce({ decimals: '18' })
      .mockResolvedValueOnce({ decimals: '10' });

    const simulationData: SimulationData = {
      tokenBalanceChanges: [
        {
          ...dummyBalanceChange,
          standard: SimulationTokenStandard.erc20,
          address: TOKEN_ADDRESS_1_MOCK,
          difference: '0x12',
          isDecrease: true,
        },
        {
          ...dummyBalanceChange,
          standard: SimulationTokenStandard.erc20,
          address: TOKEN_ADDRESS_1_MOCK,
          difference: '0x34',
          isDecrease: false,
        },
        {
          ...dummyBalanceChange,
          standard: SimulationTokenStandard.erc721,
          address: TOKEN_ADDRESS_2_MOCK,
          id: TOKEN_ID_2_MOCK,
          difference: '0x01',
          isDecrease: true,
        },
      ],
    };
    const { result, waitForNextUpdate } = renderHook(() =>
      useBalanceChanges(simulationData),
    );

    expect(result.current.pending).toBe(true);
    await waitForNextUpdate();
    expect(result.current.pending).toBe(false);

    expect(mockGetTokenStandardAndDetails).toHaveBeenCalledTimes(1);
    expect(mockGetTokenStandardAndDetails).toHaveBeenCalledWith(
      TOKEN_ADDRESS_1_MOCK,
    );
  });
});
