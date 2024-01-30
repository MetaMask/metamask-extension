import { act, renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import {
  TransactionEnvelopeType,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  GasRecommendations,
  EditGasModes,
} from '../../../../shared/constants/gas';

import { ETH, PRIMARY } from '../../../helpers/constants/common';

import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import { useGasFeeInputs } from './useGasFeeInputs';

import {
  LEGACY_GAS_ESTIMATE_RETURN_VALUE,
  FEE_MARKET_ESTIMATE_RETURN_VALUE,
  HIGH_FEE_MARKET_ESTIMATE_RETURN_VALUE,
  configureEIP1559,
  configureLegacy,
  generateUseSelectorRouter,
} from './test-utils';

jest.mock('../../../hooks/useUserPreferencedCurrency', () => ({
  useUserPreferencedCurrency: jest.fn(),
}));

jest.mock('../../../hooks/useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
    useDispatch: () => jest.fn(),
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

describe('useGasFeeInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserPreferencedCurrency.mockImplementation((type) => {
      if (type === PRIMARY) {
        return { currency: ETH, numberOfDecimals: 6 };
      }
      return { currency: 'USD', numberOfDecimals: 2 };
    });
  });

  describe('when using gasPrice API for estimation', () => {
    beforeEach(() => {
      configureLegacy();
    });
    it('passes through the raw estimate values from useGasFeeEstimates', () => {
      const { result } = renderHook(() => useGasFeeInputs());
      expect(result.current.gasFeeEstimates).toMatchObject(
        LEGACY_GAS_ESTIMATE_RETURN_VALUE.gasFeeEstimates,
      );
    });

    it('returns gasPrice appropriately, and "0" for EIP1559 fields', () => {
      const { result } = renderHook(() => useGasFeeInputs());
      expect(result.current.gasPrice).toBe(
        LEGACY_GAS_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium,
      );
      expect(result.current.maxFeePerGas).toBe('0');
      expect(result.current.maxPriorityFeePerGas).toBe('0');
    });

    it('updates values when user modifies gasPrice', () => {
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          checkNetworkAndAccountSupports1559Response: false,
        }),
      );
      const { result } = renderHook(() => useGasFeeInputs());
      expect(result.current.gasPrice).toBe(
        LEGACY_GAS_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium,
      );
      act(() => {
        result.current.setGasPrice('30');
      });
      expect(result.current.gasPrice).toBe('30');
    });
  });

  describe('when transaction is type-0', () => {
    beforeEach(() => {
      configureEIP1559();
    });

    it('returns gasPrice appropriately, and "0" for EIP1559 fields', () => {
      const { result } = renderHook(() =>
        useGasFeeInputs(GasRecommendations.medium, {
          txParams: {
            value: '3782DACE9D90000',
            gasLimit: '0x5028',
            gasPrice: '0x5028',
            type: TransactionEnvelopeType.legacy,
          },
        }),
      );
      expect(result.current.gasPrice).toBe(0.00002052);
      expect(result.current.maxFeePerGas).toBe('0');
      expect(result.current.maxPriorityFeePerGas).toBe('0');
      expect(result.current.hasBlockingGasErrors).toBeUndefined();
    });
  });

  describe('when using EIP 1559 API for estimation', () => {
    beforeEach(() => {
      configureEIP1559();
    });
    it('passes through the raw estimate values from useGasFeeEstimates', () => {
      const { result } = renderHook(() => useGasFeeInputs());
      expect(result.current.gasFeeEstimates).toMatchObject(
        FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates,
      );
    });

    it('returns EIP-1559 fields appropriately, and "0" for gasPrice fields', () => {
      const { result } = renderHook(() => useGasFeeInputs());
      expect(result.current.gasPrice).toBe('0');
      expect(result.current.maxFeePerGas).toBe(
        FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium
          .suggestedMaxFeePerGas,
      );
      expect(result.current.maxPriorityFeePerGas).toBe(
        FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium
          .suggestedMaxPriorityFeePerGas,
      );
    });
  });

  describe('when balance is sufficient for minimum transaction cost', () => {
    beforeEach(() => {
      configureEIP1559();
    });

    it('should return false', () => {
      const { result } = renderHook(() =>
        useGasFeeInputs(undefined, mockTransaction),
      );
      expect(result.current.balanceError).toBe(false);
    });
  });

  describe('when balance is insufficient for minimum transaction cost', () => {
    beforeEach(() => {
      configureEIP1559();
      useGasFeeEstimates.mockImplementation(
        () => HIGH_FEE_MARKET_ESTIMATE_RETURN_VALUE,
      );
    });

    it('should return true', () => {
      const { result } = renderHook(() =>
        useGasFeeInputs(null, {
          ...mockTransaction,
          userFeeLevel: GasRecommendations.medium,
          txParams: {
            ...mockTransaction.txParams,
            gas: '0x5208',
          },
        }),
      );
      expect(result.current.balanceError).toBe(true);
    });
  });

  describe('editGasMode', () => {
    it('should return editGasMode passed', () => {
      const { result } = renderHook(() =>
        useGasFeeInputs(undefined, undefined, undefined, EditGasModes.swaps),
      );
      expect(result.current.editGasMode).toBe(EditGasModes.swaps);
    });
  });
});
