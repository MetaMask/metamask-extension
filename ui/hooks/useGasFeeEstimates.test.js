import { renderHook, act } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { GasEstimateTypes } from '../../shared/constants/gas';
import {
  getGasEstimateTypeByChainId,
  getGasFeeEstimatesByChainId,
  getIsGasEstimatesLoadingByChainId,
  getIsNetworkBusyByChainId,
} from '../ducks/metamask/metamask';
import {
  gasFeeStartPollingByNetworkClientId,
  gasFeeStopPollingByPollingToken,
  getNetworkConfigurationByNetworkClientId,
} from '../store/actions';

import { useGasFeeEstimates } from './useGasFeeEstimates';
import usePolling from './usePolling';

jest.mock('./usePolling', () => jest.fn());

jest.mock('../store/actions', () => ({
  getNetworkConfigurationByNetworkClientId: jest.fn(),
}));

jest.mock('../ducks/metamask/metamask', () => ({
  getGasEstimateTypeByChainId: jest
    .fn()
    .mockReturnValue('getGasEstimateTypeByChainId'),
  getGasFeeEstimatesByChainId: jest
    .fn()
    .mockReturnValue('getGasFeeEstimatesByChainId'),
  getIsGasEstimatesLoadingByChainId: jest
    .fn()
    .mockReturnValue('getIsGasEstimatesLoadingByChainId'),
  getIsNetworkBusyByChainId: jest
    .fn()
    .mockReturnValue('getIsNetworkBusyByChainId'),
}));

jest.mock('../selectors', () => ({
  checkNetworkAndAccountSupports1559: jest
    .fn()
    .mockReturnValue('checkNetworkAndAccountSupports1559'),
  getSelectedNetworkClientId: jest
    .fn()
    .mockReturnValue('getSelectedNetworkClientId'),
}));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

const DEFAULT_OPTS = {
  checkNetworkAndAccountSupports1559: false,
  gasEstimateType: GasEstimateTypes.legacy,
  gasFeeEstimates: {
    low: '10',
    medium: '20',
    high: '30',
  },
  isGasEstimatesLoading: true,
};

const MOCK_STATE = {};

const generateUseSelectorRouter =
  (opts = DEFAULT_OPTS) =>
  (selector) => {
    const selectorId = selector(MOCK_STATE);
    if (selectorId === 'checkNetworkAndAccountSupports1559') {
      return (
        opts.checkNetworkAndAccountSupports1559 ??
        DEFAULT_OPTS.checkNetworkAndAccountSupports1559
      );
    }
    if (selectorId === 'getSelectedNetworkClientId') {
      return 'selectedNetworkClientId';
    }
    if (selectorId === 'getGasEstimateTypeByChainId') {
      return opts.gasEstimateType ?? DEFAULT_OPTS.gasEstimateType;
    }
    if (selectorId === 'getGasFeeEstimatesByChainId') {
      return opts.gasFeeEstimates ?? DEFAULT_OPTS.gasFeeEstimates;
    }
    if (selectorId === 'getIsGasEstimatesLoadingByChainId') {
      return opts.isGasEstimatesLoading ?? DEFAULT_OPTS.isGasEstimatesLoading;
    }
    return undefined;
  };

describe('useGasFeeEstimates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getNetworkConfigurationByNetworkClientId.mockImplementation(
      (networkClientId) => {
        if (!networkClientId) {
          return Promise.resolve(undefined);
        }

        return Promise.resolve({
          chainId: '0xa',
        });
      },
    );
  });

  it('polls the selected networkClientId by default', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter());
    await act(async () => {
      renderHook(() => useGasFeeEstimates());
    });
    expect(usePolling).toHaveBeenCalledWith({
      startPollingByNetworkClientId: gasFeeStartPollingByNetworkClientId,
      stopPollingByPollingToken: gasFeeStopPollingByPollingToken,
      networkClientId: 'selectedNetworkClientId',
    });
  });

  it('polls the passed in networkClientId when provided', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter());
    await act(async () => {
      renderHook(() => useGasFeeEstimates('networkClientId1'));
    });
    expect(usePolling).toHaveBeenCalledWith({
      startPollingByNetworkClientId: gasFeeStartPollingByNetworkClientId,
      stopPollingByPollingToken: gasFeeStopPollingByPollingToken,
      networkClientId: 'networkClientId1',
    });
  });

  it('reads state with the right chainId and networkClientId', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter());

    await act(async () =>
      renderHook(() => useGasFeeEstimates('networkClientId1')),
    );
    expect(getGasEstimateTypeByChainId).toHaveBeenCalledWith(MOCK_STATE, '0xa');
    expect(getGasFeeEstimatesByChainId).toHaveBeenCalledWith(MOCK_STATE, '0xa');
    expect(getIsGasEstimatesLoadingByChainId).toHaveBeenCalledWith(MOCK_STATE, {
      chainId: '0xa',
      networkClientId: 'networkClientId1',
    });
    expect(getIsNetworkBusyByChainId).toHaveBeenCalledWith(MOCK_STATE, '0xa');
  });

  it('works with LEGACY gas prices', async () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        isGasEstimatesLoading: false,
      }),
    );

    let hook;
    await act(async () => (hook = renderHook(() => useGasFeeEstimates())));
    expect(hook.result.current).toMatchObject({
      gasFeeEstimates: DEFAULT_OPTS.gasFeeEstimates,
      gasEstimateType: GasEstimateTypes.legacy,
      isGasEstimatesLoading: false,
    });
  });

  it('works with ETH_GASPRICE gas prices', async () => {
    const gasFeeEstimates = { gasPrice: '10' };
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        gasEstimateType: GasEstimateTypes.ethGasPrice,
        gasFeeEstimates,
        isGasEstimatesLoading: false,
      }),
    );

    let hook;
    await act(async () => (hook = renderHook(() => useGasFeeEstimates())));
    expect(hook.result.current).toMatchObject({
      gasFeeEstimates,
      gasEstimateType: GasEstimateTypes.ethGasPrice,
      isGasEstimatesLoading: false,
    });
  });

  it('works with FEE_MARKET gas prices', async () => {
    const gasFeeEstimates = {
      low: {
        minWaitTimeEstimate: 180000,
        maxWaitTimeEstimate: 300000,
        suggestedMaxPriorityFeePerGas: '3',
        suggestedMaxFeePerGas: '53',
      },
      medium: {
        minWaitTimeEstimate: 15000,
        maxWaitTimeEstimate: 60000,
        suggestedMaxPriorityFeePerGas: '7',
        suggestedMaxFeePerGas: '70',
      },
      high: {
        minWaitTimeEstimate: 0,
        maxWaitTimeEstimate: 15000,
        suggestedMaxPriorityFeePerGas: '10',
        suggestedMaxFeePerGas: '100',
      },
      estimatedBaseFee: '50',
    };
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        checkNetworkAndAccountSupports1559: true,
        gasEstimateType: GasEstimateTypes.feeMarket,
        gasFeeEstimates,
        isGasEstimatesLoading: false,
      }),
    );

    let hook;
    await act(async () => (hook = renderHook(() => useGasFeeEstimates())));
    expect(hook.result.current).toMatchObject({
      gasFeeEstimates,
      gasEstimateType: GasEstimateTypes.feeMarket,
      isGasEstimatesLoading: false,
    });
  });

  it('indicates that gas estimates are loading when gasEstimateType is NONE', async () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        gasEstimateType: GasEstimateTypes.none,
        gasFeeEstimates: {},
      }),
    );

    let hook;
    await act(async () => (hook = renderHook(() => useGasFeeEstimates())));
    expect(hook.result.current).toMatchObject({
      gasFeeEstimates: {},
      gasEstimateType: GasEstimateTypes.none,
      isGasEstimatesLoading: true,
    });
  });

  it('indicates that gas estimates are loading when gasEstimateType is not FEE_MARKET or ETH_GASPRICE, but network supports EIP-1559', async () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        checkNetworkAndAccountSupports1559: true,
        gasEstimateType: GasEstimateTypes.legacy,
        gasFeeEstimates: {
          gasPrice: '10',
        },
      }),
    );

    let hook;
    await act(async () => (hook = renderHook(() => useGasFeeEstimates())));
    expect(hook.result.current).toMatchObject({
      gasFeeEstimates: { gasPrice: '10' },
      gasEstimateType: GasEstimateTypes.legacy,
      isGasEstimatesLoading: true,
    });
  });

  it('indicates that gas estimates are loading when gasEstimateType is FEE_MARKET but network does not support EIP-1559', async () => {
    const gasFeeEstimates = {
      low: {
        minWaitTimeEstimate: 180000,
        maxWaitTimeEstimate: 300000,
        suggestedMaxPriorityFeePerGas: '3',
        suggestedMaxFeePerGas: '53',
      },
      medium: {
        minWaitTimeEstimate: 15000,
        maxWaitTimeEstimate: 60000,
        suggestedMaxPriorityFeePerGas: '7',
        suggestedMaxFeePerGas: '70',
      },
      high: {
        minWaitTimeEstimate: 0,
        maxWaitTimeEstimate: 15000,
        suggestedMaxPriorityFeePerGas: '10',
        suggestedMaxFeePerGas: '100',
      },
      estimatedBaseFee: '50',
    };
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        checkNetworkAndAccountSupports1559: false,
        gasEstimateType: GasEstimateTypes.feeMarket,
        gasFeeEstimates,
      }),
    );

    let hook;
    await act(async () => (hook = renderHook(() => useGasFeeEstimates())));
    expect(hook.result.current).toMatchObject({
      gasFeeEstimates,
      gasEstimateType: GasEstimateTypes.feeMarket,
      isGasEstimatesLoading: true,
    });
  });
});
