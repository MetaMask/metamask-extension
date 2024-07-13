import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { getNativeCurrency } from '../../../../../../../ducks/metamask/metamask';
import {
  getBestQuote,
  getCurrentDraftTransaction,
} from '../../../../../../../ducks/send';
import useGetConversionRate from './useGetConversionRate';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('useGetConversionRate', () => {
  const initialMockState = {
    bestQuote: {
      sourceAmount: '1500000000000000000',
      destinationAmount: '2000000000000000000',
    } as Record<string, unknown>,
    currentDraftTransaction: {
      sendAsset: { type: 'NATIVE' },
      receiveAsset: {
        type: 'TOKEN',
        details: { decimals: 18, symbol: 'DAI' },
      },
    } as Record<string, unknown>,
    nativeCurrency: 'ETH',
  };

  let mockState: Partial<typeof initialMockState> = { ...initialMockState };

  beforeEach(() => {
    mockState = { ...initialMockState };
    (useSelector as jest.Mock).mockImplementation((selector) => {
      switch (selector) {
        case getBestQuote:
          return mockState.bestQuote;
        case getCurrentDraftTransaction:
          return mockState.currentDraftTransaction;
        case getNativeCurrency:
          return mockState.nativeCurrency;
        default:
          return undefined;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly format conversion rate from NATIVE to ERC20', () => {
    const { result } = renderHook(() => useGetConversionRate());

    expect(result.current).toBe(`1 ETH = 1.333333333 DAI`);
  });

  it('should correctly format conversion rate from ERC20 to NATIVE', () => {
    mockState.currentDraftTransaction = {
      sendAsset: {
        type: 'TOKEN',
        details: { decimals: 18, symbol: 'DAI' },
      },
      receiveAsset: { type: 'NATIVE' },
    };

    const { result } = renderHook(() => useGetConversionRate());

    expect(result.current).toBe(`1 DAI = 1.333333333 ETH`);
  });

  it('should return undefined when bestQuote is not available', () => {
    mockState.bestQuote = undefined;

    const { result } = renderHook(() => useGetConversionRate());

    expect(result.current).toBeUndefined();
  });

  it('should return undefined when source asset is not available', () => {
    mockState.currentDraftTransaction = {
      sendAsset: undefined,
      receiveAsset: {
        type: 'TOKEN',
        details: { decimals: 18, symbol: 'DAI' },
      },
    };

    const { result } = renderHook(() => useGetConversionRate());

    expect(result.current).toBeUndefined();
  });

  it('should return undefined when destination asset is not available', () => {
    mockState.currentDraftTransaction = {
      sendAsset: { type: 'NATIVE' },
      receiveAsset: undefined,
    };

    const { result } = renderHook(() => useGetConversionRate());

    expect(result.current).toBeUndefined();
  });

  it('should correctly format conversion rate between ERC20s', () => {
    mockState.currentDraftTransaction = {
      sendAsset: { type: 'TOKEN', details: { decimals: 6, symbol: 'USDT' } },
      receiveAsset: {
        type: 'TOKEN',
        details: { decimals: 18, symbol: 'DAI' },
      },
    };

    mockState.bestQuote = {
      sourceAmount: '3000000',
      destinationAmount: '1500000000000000000',
    };

    const { result } = renderHook(() => useGetConversionRate());

    expect(result.current).toBe(`1 USDT = 0.5 DAI`);
  });
});
