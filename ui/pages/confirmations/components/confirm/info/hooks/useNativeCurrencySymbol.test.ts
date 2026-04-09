import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { CaipChainId, Hex } from '@metamask/utils';
import { getAllMultichainNetworkConfigurations } from '../../../../../../selectors';
import { useNativeCurrencySymbol } from './useNativeCurrencySymbol';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../../../../selectors', () => ({
  getAllMultichainNetworkConfigurations: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

const renderWithMock = ({
  chainId,
  mockGetAllMultichainNetworkConfigurations = {
    'eip155:1': { nativeCurrency: 'FOO' },
    'eip155:2': { nativeCurrency: 'BAR' },
    'eip155:4217': { nativeCurrency: 'USD' },
    'eip155:42431': { nativeCurrency: 'USD' },
  },
}: {
  chainId?: Hex | CaipChainId;
  mockGetAllMultichainNetworkConfigurations?: {
    [key: string]: { nativeCurrency: string };
  };
}) => {
  mockUseSelector.mockImplementation((selector) => {
    if (selector === getAllMultichainNetworkConfigurations) {
      return mockGetAllMultichainNetworkConfigurations;
    }
  });
  return renderHook(() => useNativeCurrencySymbol(chainId));
};

describe('useNativeCurrencySymbol', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('returns true when network is found in map using hex chainId', () => {
    const { result } = renderWithMock({ chainId: '0x1' });
    expect(result.current).toEqual({ nativeCurrencySymbol: 'FOO' });
  });

  it('returns false when network is found in map using hex chainId', () => {
    const { result } = renderWithMock({ chainId: '0x2' });
    expect(result.current).toEqual({ nativeCurrencySymbol: 'BAR' });
  });

  it('returns ETH when network is missing from map hex chainId', () => {
    const { result } = renderWithMock({ chainId: '0x3' });
    expect(result.current).toEqual({ nativeCurrencySymbol: 'ETH' });
  });

  it('returns FOO when network is found in map using CAIP chainId', () => {
    const { result } = renderWithMock({ chainId: 'eip155:1' });
    expect(result.current).toEqual({ nativeCurrencySymbol: 'FOO' });
  });

  it('returns BAR when network is found in map using CAIP chainId', () => {
    const { result } = renderWithMock({ chainId: 'eip155:2' });
    expect(result.current).toEqual({ nativeCurrencySymbol: 'BAR' });
  });

  it('returns ETH when network is missing from map using CAIP chainId', () => {
    const { result } = renderWithMock({ chainId: 'eip155:3' });
    expect(result.current).toEqual({ nativeCurrencySymbol: 'ETH' });
  });

  it('returns ETH when chainId is undefined', () => {
    const { result } = renderWithMock({ chainId: undefined });
    expect(result.current).toEqual({ nativeCurrencySymbol: 'ETH' });
  });

  it('returns pathUSD when chainId is CAIP Tempo Mainnet chainId', () => {
    const { result } = renderWithMock({ chainId: 'eip155:4217' });
    expect(result.current).toEqual({ nativeCurrencySymbol: 'pathUSD' });
  });

  it('returns pathUSD when chainId is CAIP Tempo Testnet chainId', () => {
    const { result } = renderWithMock({ chainId: 'eip155:42431' });
    expect(result.current).toEqual({ nativeCurrencySymbol: 'pathUSD' });
  });

  it('returns pathUSD when chainId is Hex Tempo Mainnet chainId', () => {
    const { result } = renderWithMock({ chainId: '0x1079' });
    expect(result.current).toEqual({ nativeCurrencySymbol: 'pathUSD' });
  });

  it('returns pathUSD when chainId is Hex Tempo Testnet chainId', () => {
    const { result } = renderWithMock({ chainId: '0xa5bf' });
    expect(result.current).toEqual({ nativeCurrencySymbol: 'pathUSD' });
  });
});
