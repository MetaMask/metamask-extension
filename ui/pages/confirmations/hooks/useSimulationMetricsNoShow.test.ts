import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import {
  SimulationData,
  SimulationErrorCode,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { useSimulationMetrics } from '../components/simulation-details/useSimulationMetrics';
import { useBalanceChanges } from '../components/simulation-details/useBalanceChanges';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { BalanceChange } from '../components/simulation-details/types';
import { useSimulationMetricsNoShow } from './useSimulationMetricsNoShow';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../components/simulation-details/useSimulationMetrics');
jest.mock('../components/simulation-details/useBalanceChanges');

const TRANSACTION_ID_MOCK = 'testTransactionId';
const ADDRESS_MOCK = '0x123';

const BALANCE_CHANGE_MOCK = {
  asset: { address: ADDRESS_MOCK, standard: TokenStandard.ERC20 },
  amount: new BigNumber(-1),
  fiatAmount: 1.23,
} as unknown as BalanceChange;

const TRANSACTION_BASE_MOCK = {
  id: TRANSACTION_ID_MOCK,
  chainId: '0x1',
};

describe('useSimulationMetricsNoShow', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useSimulationMetricsMock = jest.mocked(useSimulationMetrics);
  const useBalanceChangesMock = jest.mocked(useBalanceChanges);

  beforeEach(() => {
    jest.resetAllMocks();
    useBalanceChangesMock.mockReturnValue({ value: [], pending: false });
  });

  describe('simulation states', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      ['simulation in progress', undefined, true],
      [
        'simulation reverted',
        { error: { code: SimulationErrorCode.Reverted } },
        false,
      ],
      ['simulation failed', { error: { message: 'testError' } }, false],
      [
        'simulation disabled',
        { error: { code: SimulationErrorCode.Disabled } },
        false,
      ],
      [
        'chain not supported',
        { error: { code: SimulationErrorCode.ChainNotSupported } },
        false,
      ],
      ['no balance changes', { tokenBalanceChanges: [] }, false],
      [
        'with balance changes',
        { tokenBalanceChanges: [{ someChange: 'value' }] },
        false,
      ],
    ])(
      'handles %s correctly',
      (_: string, simulationData: SimulationData, expectedLoading: boolean) => {
        useSelectorMock.mockReturnValue(true);
        const props = {
          enableMetrics: true,
          transactionMeta: {
            ...TRANSACTION_BASE_MOCK,
            simulationData,
          } as TransactionMeta,
        };

        renderHook(() => useSimulationMetricsNoShow(props));

        expect(useBalanceChangesMock).toHaveBeenCalledWith({
          chainId: '0x1',
          simulationData,
        });

        expect(useSimulationMetricsMock).toHaveBeenCalledWith({
          enableMetrics: true,
          balanceChanges: [],
          loading: expectedLoading,
          simulationData,
          transactionId: TRANSACTION_ID_MOCK,
        });
      },
    );
  });

  describe('loading states', () => {
    it('sets loading true when balance changes are pending', () => {
      useBalanceChangesMock.mockReturnValue({ value: [], pending: true });
      useSelectorMock.mockReturnValue(true);

      const props = {
        enableMetrics: true,
        transactionMeta: {
          ...TRANSACTION_BASE_MOCK,
          simulationData: { tokenBalanceChanges: [] },
        } as unknown as TransactionMeta,
      };

      renderHook(() => useSimulationMetricsNoShow(props));

      expect(useSimulationMetricsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          loading: true,
        }),
      );
    });

    it('sets loading true when simulationData is undefined', () => {
      useBalanceChangesMock.mockReturnValue({ value: [], pending: false });
      useSelectorMock.mockReturnValue(true);

      const props = {
        enableMetrics: true,
        transactionMeta: {
          ...TRANSACTION_BASE_MOCK,
          simulationData: undefined,
        } as unknown as TransactionMeta,
      };

      renderHook(() => useSimulationMetricsNoShow(props));

      expect(useSimulationMetricsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          loading: true,
        }),
      );
    });
  });

  describe('metrics enablement', () => {
    it('disables metrics when transaction simulations are disabled', () => {
      useSelectorMock.mockReturnValue(false);
      const props = {
        enableMetrics: true,
        transactionMeta: {
          ...TRANSACTION_BASE_MOCK,
          simulationData: { tokenBalanceChanges: [] },
        } as unknown as TransactionMeta,
      };

      renderHook(() => useSimulationMetricsNoShow(props));

      expect(useSimulationMetricsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          enableMetrics: false,
        }),
      );
    });

    it('disables metrics when enableMetrics prop is false', () => {
      useSelectorMock.mockReturnValue(true);
      const props = {
        enableMetrics: false,
        transactionMeta: {
          ...TRANSACTION_BASE_MOCK,
          simulationData: { tokenBalanceChanges: [] },
        } as unknown as TransactionMeta,
      };

      renderHook(() => useSimulationMetricsNoShow(props));

      expect(useSimulationMetricsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          enableMetrics: false,
        }),
      );
    });

    it('enables metrics when both transaction simulations and enableMetrics are true', () => {
      useSelectorMock.mockReturnValue(true);
      const props = {
        enableMetrics: true,
        transactionMeta: {
          ...TRANSACTION_BASE_MOCK,
          simulationData: { tokenBalanceChanges: [] },
        } as unknown as TransactionMeta,
      };

      renderHook(() => useSimulationMetricsNoShow(props));

      expect(useSimulationMetricsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          enableMetrics: true,
        }),
      );
    });
  });

  describe('balance changes', () => {
    it('passes balance changes from useBalanceChanges to useSimulationMetrics', () => {
      useBalanceChangesMock.mockReturnValue({
        value: [BALANCE_CHANGE_MOCK],
        pending: false,
      });
      useSelectorMock.mockReturnValue(true);

      const props = {
        enableMetrics: true,
        transactionMeta: {
          ...TRANSACTION_BASE_MOCK,
          simulationData: { tokenBalanceChanges: [] },
        } as unknown as TransactionMeta,
      };

      renderHook(() => useSimulationMetricsNoShow(props));

      expect(useSimulationMetricsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          balanceChanges: [BALANCE_CHANGE_MOCK],
        }),
      );
    });
  });
});
