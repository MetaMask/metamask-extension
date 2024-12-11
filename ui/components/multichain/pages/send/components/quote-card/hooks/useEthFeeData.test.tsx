import { renderHook } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';
import {
  getNativeCurrency,
  getConversionRate,
  getGasFeeEstimates,
} from '../../../../../../../ducks/metamask/metamask';
import { getUsedSwapsGasPrice } from '../../../../../../../ducks/swaps/swaps';
import {
  getCurrentCurrency,
  checkNetworkAndAccountSupports1559,
  getIsSwapsChain,
} from '../../../../../../../selectors';
import { getCurrentChainId } from '../../../../../../../../shared/modules/selectors/networks';
import useEthFeeData from './useEthFeeData';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

describe('useEthFeeData', () => {
  const mockDispatch = jest.fn();
  (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

  const initialMockState = {
    getNativeCurrency: 'ETH',
    getConversionRate: 2000,
    getCurrentCurrency: 'USD',
    checkNetworkAndAccountSupports1559: true,
    getGasFeeEstimates: {
      medium: { suggestedMaxFeePerGas: '20' },
      gasPrice: null, // assume fallback every time
    } as Record<string, unknown>,
    getCurrentChainId: '1',
    getIsSwapsChain: true,
    getUsedSwapsGasPrice: '50',
  };

  let mockState: Partial<typeof initialMockState> = { ...initialMockState };

  beforeEach(() => {
    mockState = { ...initialMockState };

    (useSelector as jest.Mock).mockImplementation((selector) => {
      switch (selector) {
        case getNativeCurrency:
          return mockState.getNativeCurrency;
        case getConversionRate:
          return mockState.getConversionRate;
        case getCurrentCurrency:
          return mockState.getCurrentCurrency;
        case checkNetworkAndAccountSupports1559:
          return mockState.checkNetworkAndAccountSupports1559;
        case getGasFeeEstimates:
          return mockState.getGasFeeEstimates;
        case getCurrentChainId:
          return mockState.getCurrentChainId;
        case getIsSwapsChain:
          return mockState.getIsSwapsChain;
        case getUsedSwapsGasPrice:
          return mockState.getUsedSwapsGasPrice;
        default:
          return undefined;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted gas fees for 1559 network', () => {
    const gasLimit = 21000;

    const { result } = renderHook(() => useEthFeeData(gasLimit));

    expect(result.current.formattedFiatGasFee).toBe('$1.34');
    expect(result.current.formattedEthGasFee).toBe('0.000672 ETH');
  });

  it('should return formatted gas fees for non-1559 network', () => {
    const gasLimit = 21000;
    mockState.checkNetworkAndAccountSupports1559 = false;

    const { result } = renderHook(() => useEthFeeData(gasLimit));

    expect(result.current.formattedFiatGasFee).toBe('$3.36');
    expect(result.current.formattedEthGasFee).toBe('0.00168 ETH');
  });

  it('should return both empty strings if gas fee is not available', () => {
    const gasLimit = 21000;
    mockState.getGasFeeEstimates = {};

    const { result } = renderHook(() => useEthFeeData(gasLimit));

    expect(result.current.formattedFiatGasFee).toBe('');
    expect(result.current.formattedEthGasFee).toBe('');
  });

  it('should return fiat empty strings if native rate is not available', () => {
    const gasLimit = 21000;
    mockState.getConversionRate = undefined;

    const { result } = renderHook(() => useEthFeeData(gasLimit));

    expect(result.current.formattedFiatGasFee).toBe('');
    expect(result.current.formattedEthGasFee).toBe('0.000672 ETH');
  });

  it('should dispatch fetchAndSetSwapsGasPriceInfo for non-1559 network and swaps chain', () => {
    mockState.checkNetworkAndAccountSupports1559 = false;

    renderHook(() => useEthFeeData(21000));

    expect(mockDispatch).toHaveBeenCalled();
  });

  it('should not dispatch fetchAndSetSwapsGasPriceInfo for 1559 network', () => {
    mockState.checkNetworkAndAccountSupports1559 = true;
    renderHook(() => useEthFeeData(21000));

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should not dispatch fetchAndSetSwapsGasPriceInfo for non-swaps chain', () => {
    mockState.getIsSwapsChain = false;

    renderHook(() => useEthFeeData(21000));

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
