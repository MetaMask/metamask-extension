import { renderHook } from '@testing-library/react-hooks';
import { getShowFiatInTestnets, getCurrentChainId } from '../selectors';
import { TEST_NETWORK_IDS, CHAIN_IDS } from '../../shared/constants/network';
import { useHideFiatForTestnet } from './useHideFiatForTestnet';

jest.mock('react-redux', () => ({
  useSelector: jest.fn().mockImplementation((selector) => selector()),
}));

jest.mock('../selectors', () => ({
  getShowFiatInTestnets: jest.fn(),
  getCurrentChainId: jest.fn(),
}));

describe('useHideFiatForTestnet', () => {
  const mockGetShowFiatInTestnets = jest.mocked(getShowFiatInTestnets);
  const mockGetCurrentChainId = jest.mocked(getCurrentChainId);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('utilizes the specified chain id', () => {
    mockGetShowFiatInTestnets.mockReturnValue(false);
    mockGetCurrentChainId.mockReturnValue(TEST_NETWORK_IDS[0]);

    const { result } = renderHook(() =>
      useHideFiatForTestnet(CHAIN_IDS.MAINNET),
    );

    expect(result.current).toBe(false);
  });

  it('returns true if current network is a testnet and showFiatInTestnets is false', () => {
    mockGetShowFiatInTestnets.mockReturnValue(false);
    mockGetCurrentChainId.mockReturnValue(TEST_NETWORK_IDS[0]);

    const { result } = renderHook(() => useHideFiatForTestnet());

    expect(result.current).toBe(true);
  });

  it('returns false if current network is a testnet and showFiatInTestnets is true', () => {
    mockGetShowFiatInTestnets.mockReturnValue(true);
    mockGetCurrentChainId.mockReturnValue(TEST_NETWORK_IDS[0]);

    const { result } = renderHook(() => useHideFiatForTestnet());

    expect(result.current).toBe(false);
  });

  it('returns false if current network is not a testnet', () => {
    mockGetShowFiatInTestnets.mockReturnValue(false);
    mockGetCurrentChainId.mockReturnValue('0x1');

    const { result } = renderHook(() => useHideFiatForTestnet());

    expect(result.current).toBe(false);
  });

  it('returns false if current network is not a testnet but showFiatInTestnets is true', () => {
    mockGetShowFiatInTestnets.mockReturnValue(true);
    mockGetCurrentChainId.mockReturnValue('0x1');

    const { result } = renderHook(() => useHideFiatForTestnet());

    expect(result.current).toBe(false);
  });
});
