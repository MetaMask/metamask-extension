import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';

import { GAS_ESTIMATE_TYPES } from '../../shared/constants/gas';
import { GAS_FORM_ERRORS } from '../helpers/constants/gas';
import {
  checkNetworkAndAccountSupports1559,
  getSelectedAccount,
} from '../selectors';

import { useGasFeeErrors } from './useGasFeeErrors';

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

const LEGACY_GAS_ESTIMATE_RETURN_VALUE = {
  gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
  gasFeeEstimates: {
    low: '10',
    medium: '20',
    high: '30',
  },
  estimatedGasFeeTimeBounds: {},
};

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

const configureEIP1559 = () => {
  useSelector.mockImplementation(
    generateUseSelectorRouter({
      checkNetworkAndAccountSupports1559Response: true,
    }),
  );
};

const configureLegacy = () => {
  useSelector.mockImplementation(
    generateUseSelectorRouter({
      checkNetworkAndAccountSupports1559Response: false,
    }),
  );
};

const renderUseGasFeeErrorsHook = (props) => {
  return renderHook(() =>
    useGasFeeErrors({
      transaction: { txParams: { type: '0x2', value: '100' } },
      gasLimit: '21000',
      gasPriceToUse: '10',
      maxPriorityFeePerGasToUse: '10',
      maxFeePerGasToUse: '100',
      minimumCostInHexWei: '0x5208',
      minimumGasLimit: '0x5208',
      ...FEE_MARKET_ESTIMATE_RETURN_VALUE,
      ...props,
    }),
  );
};

describe('useGasFeeErrors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('gasLimit validation', () => {
    beforeEach(() => {
      configureLegacy();
    });
    it('does not returns gasLimitError if gasLimit is not below minimum', () => {
      const { result } = renderUseGasFeeErrorsHook(
        LEGACY_GAS_ESTIMATE_RETURN_VALUE,
      );
      expect(result.current.gasErrors.gasLimit).toBeUndefined();
      expect(result.current.hasGasErrors).toBe(false);
    });
    it('returns gasLimitError if gasLimit is below minimum', () => {
      const { result } = renderUseGasFeeErrorsHook({
        gasLimit: '100',
        ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
      });
      expect(result.current.gasErrors.gasLimit).toBe(
        GAS_FORM_ERRORS.GAS_LIMIT_OUT_OF_BOUNDS,
      );
      expect(result.current.hasGasErrors).toBe(true);
    });
  });

  describe('maxPriorityFee validation', () => {
    describe('EIP1559 compliant estimates', () => {
      beforeEach(() => {
        configureEIP1559();
      });
      it('does not return maxPriorityFeeError if maxPriorityFee is not 0', () => {
        const { result } = renderUseGasFeeErrorsHook();
        expect(result.current.gasErrors.maxPriorityFee).toBeUndefined();
        expect(result.current.hasGasErrors).toBe(false);
      });
      it('return maxPriorityFeeError if maxPriorityFee is 0', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxPriorityFeePerGasToUse: '0',
        });
        expect(result.current.gasErrors.maxPriorityFee).toBe(
          GAS_FORM_ERRORS.MAX_PRIORITY_FEE_BELOW_MINIMUM,
        );
        expect(result.current.hasGasErrors).toBe(true);
      });
    });
    describe('Legacy estimates', () => {
      beforeEach(() => {
        configureLegacy();
      });
      it('does not return maxPriorityFeeError if maxPriorityFee is 0', () => {
        const { result } = renderUseGasFeeErrorsHook(
          LEGACY_GAS_ESTIMATE_RETURN_VALUE,
        );
        expect(result.current.gasErrors.maxPriorityFee).toBeUndefined();
        expect(result.current.hasGasErrors).toBe(false);
      });
    });
  });

  describe('maxFee validation', () => {
    describe('EIP1559 compliant estimates', () => {
      beforeEach(() => {
        configureEIP1559();
      });
      it('does not return maxFeeError if maxFee is greater than maxPriorityFee', () => {
        const { result } = renderUseGasFeeErrorsHook();
        expect(result.current.gasErrors.maxFee).toBeUndefined();
        expect(result.current.hasGasErrors).toBe(false);
      });
      it('return maxFeeError if maxFee is less than maxPriorityFee', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxFeePerGasToUse: '1',
          maxPriorityFeePerGasToUse: '10',
        });
        expect(result.current.gasErrors.maxFee).toBe(
          GAS_FORM_ERRORS.MAX_FEE_IMBALANCE,
        );
        expect(result.current.hasGasErrors).toBe(true);
      });
      it('does not return MAX_FEE_IMBALANCE error if maxPriorityFeePerGasToUse is 0', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxFeePerGasToUse: '1',
          maxPriorityFeePerGasToUse: '0',
        });
        expect(result.current.gasErrors.maxFee).toBeUndefined();
      });
    });
    describe('Legacy estimates', () => {
      beforeEach(() => {
        configureLegacy();
      });
      it('does not return maxFeeError if maxFee is less than maxPriorityFee', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxFeePerGasToUse: '1',
          maxPriorityFeePerGasToUse: '10',
          ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
        });
        expect(result.current.gasErrors.maxFee).toBeUndefined();
        expect(result.current.hasGasErrors).toBe(false);
      });
    });
  });

  describe('gasPrice validation', () => {
    describe('EIP1559 compliant estimates', () => {
      beforeEach(() => {
        configureEIP1559();
      });
      it('does not return gasPriceError if gasPrice is 0', () => {
        const { result } = renderUseGasFeeErrorsHook({ gasPriceToUse: '0' });
        expect(result.current.gasErrors.gasPrice).toBeUndefined();
        expect(result.current.hasGasErrors).toBe(false);
      });
    });
    describe('Legacy estimates', () => {
      beforeEach(() => {
        configureLegacy();
      });
      it('returns gasPriceError if gasPrice is 0', () => {
        const { result } = renderUseGasFeeErrorsHook({
          gasPriceToUse: '0',
          ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
        });
        expect(result.current.gasErrors.gasPrice).toBe(
          GAS_FORM_ERRORS.GAS_PRICE_TOO_LOW,
        );
        expect(result.current.hasGasErrors).toBe(true);
      });
      it('does not return gasPriceError if gasPrice is > 0', () => {
        const { result } = renderUseGasFeeErrorsHook(
          LEGACY_GAS_ESTIMATE_RETURN_VALUE,
        );
        expect(result.current.gasErrors.gasPrice).toBeUndefined();
        expect(result.current.hasGasErrors).toBe(false);
      });
    });
  });

  describe('maxPriorityFee warning', () => {
    describe('EIP1559 compliant estimates', () => {
      beforeEach(() => {
        configureEIP1559();
      });
      it('does not return maxPriorityFeeWarning if maxPriorityFee is > suggestedMaxPriorityFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook();
        expect(result.current.gasWarnings.maxPriorityFee).toBeUndefined();
      });
      it('return maxPriorityFeeWarning if maxPriorityFee is < suggestedMaxPriorityFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxPriorityFeePerGasToUse: '1',
        });
        expect(result.current.gasWarnings.maxPriorityFee).toBe(
          GAS_FORM_ERRORS.MAX_PRIORITY_FEE_TOO_LOW,
        );
      });
      it('return maxPriorityFeeWarning if maxPriorityFee is > gasFeeEstimates.high.suggestedMaxPriorityFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxPriorityFeePerGasToUse: '100',
        });
        expect(result.current.gasWarnings.maxPriorityFee).toBe(
          GAS_FORM_ERRORS.MAX_PRIORITY_FEE_HIGH_WARNING,
        );
      });
    });
    describe('Legacy estimates', () => {
      beforeEach(() => {
        configureLegacy();
      });
      it('does not return maxPriorityFeeWarning if maxPriorityFee is < gasFeeEstimates.low.suggestedMaxPriorityFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxPriorityFeePerGasToUse: '1',
          ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
        });
        expect(result.current.gasWarnings.maxPriorityFee).toBeUndefined();
        expect(result.current.hasGasErrors).toBe(false);
      });
    });
  });

  describe('maxFee warning', () => {
    describe('EIP1559 compliant estimates', () => {
      beforeEach(() => {
        configureEIP1559();
      });
      it('does not return maxFeeWarning if maxFee is > suggestedMaxFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook();
        expect(result.current.gasWarnings.maxFee).toBeUndefined();
      });
      it('return maxFeeWarning if maxFee is < suggestedMaxFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxFeePerGasToUse: '20',
        });
        expect(result.current.gasWarnings.maxFee).toBe(
          GAS_FORM_ERRORS.MAX_FEE_TOO_LOW,
        );
      });
      it('return maxFeeWarning if gasFeeEstimates are high and maxFee is > suggestedMaxFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxFeePerGasToUse: '1000',
        });
        expect(result.current.gasWarnings.maxFee).toBe(
          GAS_FORM_ERRORS.MAX_FEE_HIGH_WARNING,
        );
      });
    });
    describe('Legacy estimates', () => {
      beforeEach(() => {
        configureLegacy();
      });
      it('does not return maxFeeWarning if maxFee is < suggestedMaxFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxFeePerGasToUse: '1',
          ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
        });
        expect(result.current.gasWarnings.maxFee).toBeUndefined();
      });
    });
  });

  describe('Balance Error', () => {
    it('is false if balance is greater than transaction value', () => {
      configureEIP1559();
      const { result } = renderUseGasFeeErrorsHook();
      expect(result.current.balanceError).toBe(false);
    });
    it('is true if balance is less than transaction value', () => {
      configureLegacy();
      const { result } = renderUseGasFeeErrorsHook({
        transaction: { txParams: { type: '0x2', value: '0x440aa47cc2556' } },
        ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
      });
      expect(result.current.balanceError).toBe(true);
    });
  });

  describe('estimatesUnavailableWarning', () => {
    it('is false if supportsEIP1559 and gasEstimateType is fee-market', () => {
      configureEIP1559();
      const { result } = renderUseGasFeeErrorsHook();
      expect(result.current.estimatesUnavailableWarning).toBe(false);
    });
    it('is true if supportsEIP1559 and gasEstimateType is not fee-market', () => {
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          checkNetworkAndAccountSupports1559Response: true,
        }),
      );
      const { result } = renderUseGasFeeErrorsHook(
        LEGACY_GAS_ESTIMATE_RETURN_VALUE,
      );
      expect(result.current.estimatesUnavailableWarning).toBe(true);
    });
  });
});
