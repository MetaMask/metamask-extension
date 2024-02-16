import { cleanup, renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { GasEstimateTypes } from '../../shared/constants/gas';
import createRandomId from '../../shared/modules/random-id';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  getIsGasEstimatesLoading,
} from '../ducks/metamask/metamask';
import { checkNetworkAndAccountSupports1559, getSelectedNetworkClientId } from '../selectors';
import {
  gasFeeStopPollingByPollingToken,
  gasFeeStartPollingByNetworkClientId,
} from '../store/actions';

import { useGasFeeEstimates } from './useGasFeeEstimates';

jest.mock('../store/actions', () => ({
  gasFeeStopPollingByPollingToken: jest.fn(),
  gasFeeStartPollingByNetworkClientId: jest.fn(),
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

const generateUseSelectorRouter =
  (opts = DEFAULT_OPTS) =>
  (selector) => {
    if (selector === checkNetworkAndAccountSupports1559) {
      return (
        opts.checkNetworkAndAccountSupports1559 ??
        DEFAULT_OPTS.checkNetworkAndAccountSupports1559
      );
    }
    if (selector === getSelectedNetworkClientId) {
      return 'selectedNetworkClientId';
    }
    if (selector === getGasEstimateType) {
      return opts.gasEstimateType ?? DEFAULT_OPTS.gasEstimateType;
    }
    if (selector === getGasFeeEstimates) {
      return opts.gasFeeEstimates ?? DEFAULT_OPTS.gasFeeEstimates;
    }
    if (selector === getIsGasEstimatesLoading) {
      return opts.isGasEstimatesLoading ?? DEFAULT_OPTS.isGasEstimatesLoading;
    }
    return undefined;
  };

describe('useGasFeeEstimates', () => {
  let tokens = [];
  beforeEach(() => {
    jest.clearAllMocks();
    tokens = [];
    gasFeeStartPollingByNetworkClientId.mockImplementation(() => {
      const token = createRandomId();
      tokens.push(token);
      return Promise.resolve(token);
    });
    gasFeeStopPollingByPollingToken.mockImplementation((token) => {
      tokens = tokens.filter((tkn) => tkn !== token);
    });
  });

  it('registers with the controller', () => {
    useSelector.mockImplementation(generateUseSelectorRouter());
    renderHook(() => useGasFeeEstimates());
    expect(tokens).toHaveLength(1);
  });

  it('clears token with the controller on unmount', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter());
    renderHook(() => useGasFeeEstimates());
    expect(tokens).toHaveLength(1);
    const expectedToken = tokens[0];
    await cleanup();
    expect(gasFeeStartPollingByNetworkClientId).toHaveBeenCalledTimes(1);
    expect(gasFeeStopPollingByPollingToken).toHaveBeenCalledWith(expectedToken);
    expect(tokens).toHaveLength(0);
  });

  it('polls the selected networkClientId by default', () => {
    useSelector.mockImplementation(generateUseSelectorRouter());
    renderHook(() => useGasFeeEstimates());
    expect(gasFeeStartPollingByNetworkClientId).toHaveBeenCalledTimes(1);
    expect(gasFeeStartPollingByNetworkClientId).toHaveBeenCalledWith('selectedNetworkClientId', undefined)
  });

  it('polls the passed in networkClientId when provided', () => {
    useSelector.mockImplementation(generateUseSelectorRouter());
    renderHook(() => useGasFeeEstimates('networkClientId1'));
    expect(gasFeeStartPollingByNetworkClientId).toHaveBeenCalledTimes(1);
    expect(gasFeeStartPollingByNetworkClientId).toHaveBeenCalledWith('networkClientId1', undefined)
  });

  it('works with LEGACY gas prices', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        isGasEstimatesLoading: false,
      }),
    );
    const {
      result: { current },
    } = renderHook(() => useGasFeeEstimates());
    expect(current).toMatchObject({
      gasFeeEstimates: DEFAULT_OPTS.gasFeeEstimates,
      gasEstimateType: GasEstimateTypes.legacy,
      isGasEstimatesLoading: false,
    });
  });

  it('works with ETH_GASPRICE gas prices', () => {
    const gasFeeEstimates = { gasPrice: '10' };
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        gasEstimateType: GasEstimateTypes.ethGasPrice,
        gasFeeEstimates,
        isGasEstimatesLoading: false,
      }),
    );

    const {
      result: { current },
    } = renderHook(() => useGasFeeEstimates());
    expect(current).toMatchObject({
      gasFeeEstimates,
      gasEstimateType: GasEstimateTypes.ethGasPrice,
      isGasEstimatesLoading: false,
    });
  });

  it('works with FEE_MARKET gas prices', () => {
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

    const {
      result: { current },
    } = renderHook(() => useGasFeeEstimates());
    expect(current).toMatchObject({
      gasFeeEstimates,
      gasEstimateType: GasEstimateTypes.feeMarket,
      isGasEstimatesLoading: false,
    });
  });

  it('indicates that gas estimates are loading when gasEstimateType is NONE', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        gasEstimateType: GasEstimateTypes.none,
        gasFeeEstimates: {},
      }),
    );

    const {
      result: { current },
    } = renderHook(() => useGasFeeEstimates());
    expect(current).toMatchObject({
      gasFeeEstimates: {},
      gasEstimateType: GasEstimateTypes.none,
      isGasEstimatesLoading: true,
    });
  });

  it('indicates that gas estimates are loading when gasEstimateType is not FEE_MARKET or ETH_GASPRICE, but network supports EIP-1559', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        checkNetworkAndAccountSupports1559: true,
        gasEstimateType: GasEstimateTypes.legacy,
        gasFeeEstimates: {
          gasPrice: '10',
        },
      }),
    );

    const {
      result: { current },
    } = renderHook(() => useGasFeeEstimates());
    expect(current).toMatchObject({
      gasFeeEstimates: { gasPrice: '10' },
      gasEstimateType: GasEstimateTypes.legacy,
      isGasEstimatesLoading: true,
    });
  });

  it('indicates that gas estimates are loading when gasEstimateType is FEE_MARKET but network does not support EIP-1559', () => {
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

    const {
      result: { current },
    } = renderHook(() => useGasFeeEstimates());
    expect(current).toMatchObject({
      gasFeeEstimates,
      gasEstimateType: GasEstimateTypes.feeMarket,
      isGasEstimatesLoading: true,
    });
  });
});
