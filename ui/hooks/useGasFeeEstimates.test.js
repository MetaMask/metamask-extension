import { cleanup, renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { GAS_ESTIMATE_TYPES } from '../../shared/constants/gas';
import createRandomId from '../../shared/modules/random-id';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  isEIP1559Network,
} from '../ducks/metamask/metamask';
import {
  disconnectGasFeeEstimatePoller,
  getGasFeeEstimatesAndStartPolling,
} from '../store/actions';
import { useGasFeeEstimates } from './useGasFeeEstimates';

jest.mock('../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn(),
}));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

const DEFAULT_OPTS = {
  isEIP1559Network: false,
  gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
  gasFeeEstimates: {
    low: '10',
    medium: '20',
    high: '30',
  },
};

const generateUseSelectorRouter = (opts = DEFAULT_OPTS) => (selector) => {
  if (selector === isEIP1559Network) {
    return opts.isEIP1559Network ?? DEFAULT_OPTS.isEIP1559Network;
  }
  if (selector === getGasEstimateType) {
    return opts.gasEstimateType ?? DEFAULT_OPTS.gasEstimateType;
  }
  if (selector === getGasFeeEstimates) {
    return opts.gasFeeEstimates ?? DEFAULT_OPTS.gasFeeEstimates;
  }
  return undefined;
};

describe('useGasFeeEstimates', () => {
  let tokens = [];
  beforeEach(() => {
    jest.clearAllMocks();
    tokens = [];
    getGasFeeEstimatesAndStartPolling.mockImplementation(() => {
      const token = createRandomId();
      tokens.push(token);
      return Promise.resolve(token);
    });
    disconnectGasFeeEstimatePoller.mockImplementation((token) => {
      tokens = tokens.filter((tkn) => tkn !== token);
    });
    useSelector.mockImplementation(generateUseSelectorRouter());
  });

  it('registers with the controller', () => {
    renderHook(() => useGasFeeEstimates());
    expect(tokens).toHaveLength(1);
  });

  it('clears token with the controller on unmount', async () => {
    renderHook(() => useGasFeeEstimates());
    expect(tokens).toHaveLength(1);
    const expectedToken = tokens[0];
    await cleanup();
    expect(getGasFeeEstimatesAndStartPolling).toHaveBeenCalledTimes(1);
    expect(disconnectGasFeeEstimatePoller).toHaveBeenCalledWith(expectedToken);
    expect(tokens).toHaveLength(0);
  });

  it('works with LEGACY gas prices', () => {
    const {
      result: { current },
    } = renderHook(() => useGasFeeEstimates());
    expect(current).toMatchObject({
      gasFeeEstimates: DEFAULT_OPTS.gasFeeEstimates,
      gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
      estimatedGasFeeTimeBounds: undefined,
      isGasEstimatesLoading: false,
    });
  });

  it('works with ETH_GASPRICE gas prices', () => {
    const gasFeeEstimates = { gasPrice: '10' };
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        gasEstimateType: GAS_ESTIMATE_TYPES.ETH_GASPRICE,
        gasFeeEstimates,
      }),
    );

    const {
      result: { current },
    } = renderHook(() => useGasFeeEstimates());
    expect(current).toMatchObject({
      gasFeeEstimates,
      gasEstimateType: GAS_ESTIMATE_TYPES.ETH_GASPRICE,
      estimatedGasFeeTimeBounds: undefined,
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
        isEIP1559Network: true,
        gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
        gasFeeEstimates,
      }),
    );

    const {
      result: { current },
    } = renderHook(() => useGasFeeEstimates());
    expect(current).toMatchObject({
      gasFeeEstimates,
      gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
      estimatedGasFeeTimeBounds: undefined,
      isGasEstimatesLoading: false,
    });
  });

  it('indicates that gas estimates are loading when gasEstimateType is NONE', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        gasEstimateType: GAS_ESTIMATE_TYPES.NONE,
        gasFeeEstimates: {},
      }),
    );

    const {
      result: { current },
    } = renderHook(() => useGasFeeEstimates());
    expect(current).toMatchObject({
      gasFeeEstimates: {},
      gasEstimateType: GAS_ESTIMATE_TYPES.NONE,
      estimatedGasFeeTimeBounds: undefined,
      isGasEstimatesLoading: true,
    });
  });

  it('indicates that gas estimates are loading when gasEstimateType is not FEE_MARKET but network supports EIP-1559', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        isEIP1559Network: true,
        gasEstimateType: GAS_ESTIMATE_TYPES.ETH_GASPRICE,
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
      gasEstimateType: GAS_ESTIMATE_TYPES.ETH_GASPRICE,
      estimatedGasFeeTimeBounds: undefined,
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
        isEIP1559Network: false,
        gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
        gasFeeEstimates,
      }),
    );

    const {
      result: { current },
    } = renderHook(() => useGasFeeEstimates());
    expect(current).toMatchObject({
      gasFeeEstimates,
      gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
      estimatedGasFeeTimeBounds: undefined,
      isGasEstimatesLoading: true,
    });
  });
});
