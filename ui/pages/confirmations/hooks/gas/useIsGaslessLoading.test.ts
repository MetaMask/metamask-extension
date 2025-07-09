import { renderHook } from '@testing-library/react-hooks';
import { useIsGaslessLoading } from './useIsGaslessLoading';
import { useSelector } from 'react-redux';
import { useConfirmContext } from '../../context/confirm';
import { useIsGaslessSupported } from './useIsGaslessSupported';
import { getUseTransactionSimulations } from '../../../../selectors';
import { useIsInsufficientBalance } from '../useIsInsufficientBalance';

jest.mock('../../context/confirm');
jest.mock('./useIsGaslessSupported');
jest.mock('../useIsInsufficientBalance');
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockedUseConfirmContext = jest.mocked(useConfirmContext);
const mockedUseIsGaslessSupported = jest.mocked(useIsGaslessSupported);
const mockedUseIsInsufficientBalance = jest.mocked(useIsInsufficientBalance);
const mockedUseSelector = useSelector as jest.Mock;

describe('useIsGaslessLoading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = ({
    simulationEnabled,
    gaslessSupported,
    insufficientBalance,
    simulationData,
  }: {
    simulationEnabled: boolean;
    gaslessSupported: boolean;
    insufficientBalance: boolean;
    simulationData?: object | null;
  }) => {
    mockedUseSelector.mockImplementation((selector) => {
      if (selector === getUseTransactionSimulations) return simulationEnabled;
      return false;
    });

    mockedUseConfirmContext.mockReturnValue({
      currentConfirmation: simulationData ? { simulationData } : {},
    } as any);

    mockedUseIsGaslessSupported.mockReturnValue({ isSupported: gaslessSupported, isSmartTransaction: true });
    mockedUseIsInsufficientBalance.mockReturnValue(insufficientBalance);
  };

  it('returns true if simulation is disabled', () => {
    setup({
      simulationEnabled: false,
      gaslessSupported: true,
      insufficientBalance: true,
    });

    const { result } = renderHook(() => useIsGaslessLoading());
    expect(result.current.isGaslessLoading).toBe(true);
  });

  it('returns true if gasless is not supported', () => {
    setup({
      simulationEnabled: true,
      gaslessSupported: false,
      insufficientBalance: true,
    });

    const { result } = renderHook(() => useIsGaslessLoading());
    expect(result.current.isGaslessLoading).toBe(true);
  });

  it('returns true if no insufficient balance', () => {
    setup({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: false,
    });

    const { result } = renderHook(() => useIsGaslessLoading());
    expect(result.current.isGaslessLoading).toBe(true);
  });

  it('returns true if simulation data is present', () => {
    setup({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: true,
      simulationData: { tokenBalanceChanges: [] },
    });

    const { result } = renderHook(() => useIsGaslessLoading());
    expect(result.current.isGaslessLoading).toBe(true);
  });

  it('returns false if all checks fail', () => {
    setup({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: true,
      simulationData: null,
    });

    const { result } = renderHook(() => useIsGaslessLoading());
    expect(result.current.isGaslessLoading).toBe(false);
  });
});
