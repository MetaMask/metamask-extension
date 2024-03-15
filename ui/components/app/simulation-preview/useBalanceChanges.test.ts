import { renderHook } from '@testing-library/react-hooks';
import { useBalanceChanges } from './useBalanceChanges';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import { SimulationData, SimulationTokenStandard } from '@metamask/transaction-controller';
import { useTokenDetails } from '../../../hooks/useTokenDetails';
import { Hex } from '@metamask/utils';

jest.mock('../../../hooks/useTokenDetails', () => ({
  useTokenDetails: jest.fn(),
}));

const mockUseTokenDetails = useTokenDetails as jest.Mock;

const dummyBalanceChange = {
  previousBalance: '0xIGNORE' as Hex,
  newBalance: '0xIGNORE' as Hex,
};

const TOKEN_ADDRESS_MOCK = '0x123';
const TOKEN_ID_MOCK = '0x456';

describe('useBalanceChanges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty result when simulationData is undefined', () => {
    const { result } = renderHook(() => useBalanceChanges());
    expect(result.current).toEqual({ isLoading: false, balanceChanges: [] });
  });

  it('should handle native asset balance change', () => {
    const simulationData: SimulationData = {
      nativeBalanceChange: {
        ...dummyBalanceChange,
        difference: '0x1',
        isDecrease: true,
      },
      tokenBalanceChanges: [],
    };
    mockUseTokenDetails.mockReturnValue({
      isLoading: false,
      addressToTokenDetails: {},
    });
    const { result } = renderHook(() => useBalanceChanges(simulationData));
    expect(result.current.balanceChanges).toEqual([
      {
        assetInfo: { isNative: true },
        isDecrease: true,
        absChange: new Numeric('1', 16, EtherDenomination.WEI),
      },
    ]);
  });

  it('should handle ERC20 token balance change with default decimals', () => {
    const simulationData: SimulationData = {
      tokenBalanceChanges: [
        {
          ...dummyBalanceChange,
          standard: SimulationTokenStandard.erc20,
          address: TOKEN_ADDRESS_MOCK,
          difference: '0x1',
          isDecrease: true,
        },
      ],
    };
    mockUseTokenDetails.mockReturnValue({
      isLoading: false,
      addressToTokenDetails: {
        [TOKEN_ADDRESS_MOCK]: { decimals: undefined },
      },
    });
    const { result } = renderHook(() => useBalanceChanges(simulationData));
    expect(result.current.balanceChanges).toEqual([
      {
        assetInfo: {
          isNative: false,
          standard: SimulationTokenStandard.erc20,
          contractAddress: TOKEN_ADDRESS_MOCK,
          tokenId: undefined,
        },
        isDecrease: true,
        absChange: Numeric.from('1', 16).shiftedBy(18),
      },
    ]);
  });

  it('should handle ERC20 token balance change with provided decimals', () => {
    const simulationData: SimulationData = {
      tokenBalanceChanges: [
        {
          ...dummyBalanceChange,
          standard: SimulationTokenStandard.erc20,
          address: TOKEN_ADDRESS_MOCK,
          difference: '0x1',
          isDecrease: true,
        },
      ],
    };
    mockUseTokenDetails.mockReturnValue({
      isLoading: false,
      addressToTokenDetails: {
        [TOKEN_ADDRESS_MOCK]: { decimals: '6' },
      },
    });
    const { result } = renderHook(() => useBalanceChanges(simulationData));
    expect(result.current.balanceChanges).toEqual([
      {
        assetInfo: {
          isNative: false,
          standard: SimulationTokenStandard.erc20,
          contractAddress: TOKEN_ADDRESS_MOCK,
          tokenId: undefined,
        },
        isDecrease: true,
        absChange: Numeric.from('1', 16).shiftedBy(6),
      },
    ]);
  });

  it('should handle ERC721 token balance change', () => {
    const simulationData: SimulationData = {
      tokenBalanceChanges: [
        {
          ...dummyBalanceChange,
          standard: SimulationTokenStandard.erc721,
          address: TOKEN_ADDRESS_MOCK,
          id: TOKEN_ID_MOCK,
          difference: '0x1',
          isDecrease: true,
        },
      ],
    };
    mockUseTokenDetails.mockReturnValue({
      isLoading: false,
      addressToTokenDetails: {
        [TOKEN_ADDRESS_MOCK]: { decimals: undefined },
      },
    });
    const { result } = renderHook(() => useBalanceChanges(simulationData));
    expect(result.current.balanceChanges).toEqual([
      {
        assetInfo: {
          isNative: false,
          standard: SimulationTokenStandard.erc721,
          contractAddress: TOKEN_ADDRESS_MOCK,
          tokenId: TOKEN_ID_MOCK,
        },
        isDecrease: true,
        absChange: Numeric.from(1, 10),
      },
    ]);
  });

  it('should handle ERC1155 token balance change', () => {
    const simulationData: SimulationData = {
      tokenBalanceChanges: [
        {
          ...dummyBalanceChange,
          standard: SimulationTokenStandard.erc1155,
          address: TOKEN_ADDRESS_MOCK,
          id: TOKEN_ID_MOCK,
          difference: '0x2',
          isDecrease: true,
        },
      ],
    };
    mockUseTokenDetails.mockReturnValue({
      isLoading: false,
      addressToTokenDetails: {
        [TOKEN_ADDRESS_MOCK]: { decimals: undefined },
      },
    });
    const { result } = renderHook(() => useBalanceChanges(simulationData));
    expect(result.current.balanceChanges).toEqual([
      {
        assetInfo: {
          isNative: false,
          standard: SimulationTokenStandard.erc1155,
          contractAddress: TOKEN_ADDRESS_MOCK,
          tokenId: TOKEN_ID_MOCK,
        },
        isDecrease: true,
        absChange: Numeric.from('0x2', 16),
      },
    ]);
  });

  it('should return isLoading when useTokenDetails is loading', () => {
    const simulationData: SimulationData = {
      tokenBalanceChanges: [
        {
          ...dummyBalanceChange,
          standard: SimulationTokenStandard.erc20,
          address: TOKEN_ADDRESS_MOCK,
          difference: '0x1',
          isDecrease: true,
        },
      ],
    };
    mockUseTokenDetails.mockReturnValue({
      isLoading: true,
      addressToTokenDetails: {},
    });
    const { result } = renderHook(() => useBalanceChanges(simulationData));
    expect(result.current).toEqual({ isLoading: true, balanceChanges: [] });
  });
});