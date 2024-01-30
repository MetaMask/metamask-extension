import { renderHook } from '@testing-library/react-hooks';

import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { GAS_FORM_ERRORS } from '../../../helpers/constants/gas';

import { useGasFeeErrors } from './useGasFeeErrors';

import {
  FEE_MARKET_ESTIMATE_RETURN_VALUE,
  LEGACY_GAS_ESTIMATE_RETURN_VALUE,
  configureEIP1559,
  configureLegacy,
} from './test-utils';

jest.mock('../../../hooks/useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

const mockTransaction = {
  status: TransactionStatus.unapproved,
  type: TransactionType.simpleSend,
  txParams: {
    from: '0x000000000000000000000000000000000000dead',
    type: '0x2',
    value: '100',
  },
};

const renderUseGasFeeErrorsHook = (props) => {
  return renderHook(() =>
    useGasFeeErrors({
      transaction: mockTransaction,
      gasLimit: '21000',
      gasPrice: '10',
      maxPriorityFeePerGas: '10',
      maxFeePerGas: '100',
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
      it('does not return maxPriorityFeeError if maxPriorityFee is 0', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxPriorityFeePerGas: '0',
        });
        expect(result.current.gasErrors.maxPriorityFee).not.toBe(
          GAS_FORM_ERRORS.MAX_PRIORITY_FEE_BELOW_MINIMUM,
        );
        expect(result.current.hasGasErrors).toBe(false);
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
          maxFeePerGas: '1',
          maxPriorityFeePerGas: '10',
        });
        expect(result.current.gasErrors.maxFee).toBe(
          GAS_FORM_ERRORS.MAX_FEE_IMBALANCE,
        );
        expect(result.current.hasGasErrors).toBe(true);
      });
      it('does not return MAX_FEE_IMBALANCE error if maxPriorityFeePerGas is 0', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxFeePerGas: '1',
          maxPriorityFeePerGas: '0',
        });
        expect(result.current.gasErrors.maxFee).not.toBe(
          GAS_FORM_ERRORS.MAX_FEE_IMBALANCE,
        );
      });
    });
    describe('Legacy estimates', () => {
      beforeEach(() => {
        configureLegacy();
      });
      it('does not return maxFeeError if maxFee is less than maxPriorityFee', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxFeePerGas: '1',
          maxPriorityFeePerGas: '10',
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
        const { result } = renderUseGasFeeErrorsHook({ gasPrice: '0' });
        expect(result.current.gasErrors.gasPrice).toBeUndefined();
        expect(result.current.hasGasErrors).toBe(false);
      });
    });
    describe('Legacy estimates', () => {
      beforeEach(() => {
        configureLegacy();
      });
      it('does not return gasPriceError if gasPrice is 0', () => {
        const { result } = renderUseGasFeeErrorsHook({
          gasPrice: '0',
          ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
        });
        expect(result.current.gasErrors.gasPrice).not.toBe(
          GAS_FORM_ERRORS.GAS_PRICE_TOO_LOW,
        );
        expect(result.current.hasGasErrors).toBe(false);
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

  describe('maxPriorityFee gasErrors (derived from warnings)', () => {
    describe('EIP1559 compliant estimates', () => {
      beforeEach(() => {
        configureEIP1559();
      });
      it('does not return maxPriorityFeeWarning if maxPriorityFee is > suggestedMaxPriorityFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook();
        expect(result.current.gasErrors.maxPriorityFee).toBeUndefined();
      });
      it('return maxPriorityFeeWarning if maxPriorityFee is < suggestedMaxPriorityFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxPriorityFeePerGas: '1',
        });
        expect(result.current.gasErrors.maxPriorityFee).toBe(
          GAS_FORM_ERRORS.MAX_PRIORITY_FEE_TOO_LOW,
        );
      });
      it('return maxPriorityFeeWarning if maxPriorityFee is > gasFeeEstimates.high.suggestedMaxPriorityFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxPriorityFeePerGas: '100',
        });
        expect(result.current.gasErrors.maxPriorityFee).toBe(
          GAS_FORM_ERRORS.MAX_PRIORITY_FEE_HIGH_WARNING,
        );
      });
    });
    describe('Legacy estimates', () => {
      beforeEach(() => {
        configureLegacy();
      });
      it('does not return maxPriorityFee error if maxPriorityFee is < gasFeeEstimates.low.suggestedMaxPriorityFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxPriorityFeePerGas: '1',
          ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
        });
        expect(result.current.gasErrors.maxPriorityFee).toBeUndefined();
        expect(result.current.hasGasErrors).toBe(false);
      });
    });
  });

  describe('maxFee gasErrors', () => {
    describe('EIP1559 compliant estimates', () => {
      beforeEach(() => {
        configureEIP1559();
      });
      it('does not return maxFeeWarning if maxFee is > suggestedMaxFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook();
        expect(result.current.gasErrors.maxFee).toBeUndefined();
      });
      it('return maxFeeWarning if maxFee is < suggestedMaxFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxFeePerGas: '20',
        });
        expect(result.current.gasErrors.maxFee).toBe(
          GAS_FORM_ERRORS.MAX_FEE_TOO_LOW,
        );
      });
      it('return maxFeeWarning if gasFeeEstimates are high and maxFee is > suggestedMaxFeePerGas', () => {
        const { result } = renderUseGasFeeErrorsHook({
          maxFeePerGas: '1000',
        });
        expect(result.current.gasErrors.maxFee).toBe(
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
          maxFeePerGas: '1',
          ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
        });
        expect(result.current.gasErrors.maxFee).toBeUndefined();
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
        transaction: {
          ...mockTransaction,
          txParams: {
            ...mockTransaction.txParams,
            value: '0x440aa47cc2556',
          },
        },
        ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
      });
      expect(result.current.balanceError).toBe(true);
    });
  });

  describe('Simulation Error', () => {
    it('is false if transaction has falsy values for simulationFails', () => {
      configureEIP1559();
      const { result } = renderUseGasFeeErrorsHook();
      expect(result.current.hasSimulationError).toBe(false);
    });
    it('is true if transaction.simulationFails is true', () => {
      configureEIP1559();
      const { result } = renderUseGasFeeErrorsHook({
        transaction: { simulationFails: true },
      });
      expect(result.current.hasSimulationError).toBe(true);
    });
  });
});
