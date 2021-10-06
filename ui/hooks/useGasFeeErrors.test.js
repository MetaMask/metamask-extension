import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';

import { GAS_ESTIMATE_TYPES } from '../../shared/constants/gas';
import { GAS_FORM_ERRORS } from '../helpers/constants/gas';
import {
  checkNetworkAndAccountSupports1559,
  getSelectedAccount,
} from '../selectors';

import { useGasFeeErrors } from './useGasFeeErrors';
import { useGasFeeEstimates } from './useGasFeeEstimates';

jest.mock('./useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

const FEE_MARKET_ESTIMATE_RETURN_VALUE = {
  gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
  gasFeeEstimates: {
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
  },
  estimatedGasFeeTimeBounds: {},
};

const generateUseSelectorRouter = ({
  checkNetworkAndAccountSupports1559Response,
} = {}) => (selector) => {
  if (selector === getSelectedAccount) {
    return {
      balance: '0x440aa47cc2556',
    };
  }
  if (selector === checkNetworkAndAccountSupports1559) {
    return checkNetworkAndAccountSupports1559Response;
  }
  return undefined;
};

const renderUseGasFeeErrorsHook = (props) => {
  return renderHook(() =>
    useGasFeeErrors({
      transaction: { txParams: { type: '0x2' } },
      gasLimit: '21000',
      gasPriceToUse: '10',
      maxPriorityFeePerGasToUse: '10',
      maxFeePerGasToUse: '100',
      minimumCostInHexWei: '0x5208',
      minimumGasLimit: '0x5208',
      ...props,
    }),
  );
};

describe('useGasFeeErrors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('gasLimitError', () => {
    beforeEach(() => {
      useGasFeeEstimates.mockImplementation(
        () => FEE_MARKET_ESTIMATE_RETURN_VALUE,
      );
      useSelector.mockImplementation(generateUseSelectorRouter());
    });
    it('returns gasLimitError if gasLimit is below minimum', () => {
      const { result } = renderUseGasFeeErrorsHook({ gasLimit: '100' });
      expect(result.current.gasErrors.gasLimit).toBe(
        GAS_FORM_ERRORS.GAS_LIMIT_OUT_OF_BOUNDS,
      );
    });
  });
});
