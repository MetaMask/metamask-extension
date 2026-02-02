import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useTransactionNativeTicker } from './useTransactionNativeTicker';

const CHAIN_ID_MOCK = '0x1';

const mockUseConfirmContext = jest.fn();

jest.mock('../../context/confirm', () => ({
  useConfirmContext: () => mockUseConfirmContext(),
}));

describe('useTransactionNativeTicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns native currency for the transaction chain', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        chainId: CHAIN_ID_MOCK,
      },
      isScrollToBottomCompleted: true,
      setIsScrollToBottomCompleted: jest.fn(),
    });

    const { result } = renderHookWithProvider(
      () => useTransactionNativeTicker(),
      {
        metamask: {
          networkConfigurationsByChainId: {
            [CHAIN_ID_MOCK]: {
              nativeCurrency: 'ETH',
            },
          },
        },
      },
    );

    expect(result.current).toBe('ETH');
  });

  it('returns undefined when network configuration is not found', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        chainId: CHAIN_ID_MOCK,
      },
      isScrollToBottomCompleted: true,
      setIsScrollToBottomCompleted: jest.fn(),
    });

    const { result } = renderHookWithProvider(
      () => useTransactionNativeTicker(),
      {
        metamask: {
          networkConfigurationsByChainId: {},
        },
      },
    );

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when currentConfirmation is undefined', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: undefined,
      isScrollToBottomCompleted: true,
      setIsScrollToBottomCompleted: jest.fn(),
    });

    const { result } = renderHookWithProvider(
      () => useTransactionNativeTicker(),
      {
        metamask: {
          networkConfigurationsByChainId: {
            [CHAIN_ID_MOCK]: {
              nativeCurrency: 'ETH',
            },
          },
        },
      },
    );

    expect(result.current).toBeUndefined();
  });
});
