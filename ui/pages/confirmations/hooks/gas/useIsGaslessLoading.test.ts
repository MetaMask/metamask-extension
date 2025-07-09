import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { useConfirmContext } from '../../context/confirm';
import { getUseTransactionSimulations } from '../../../../selectors';
import { useIsInsufficientBalance } from '../useIsInsufficientBalance';
import { useIsGaslessSupported } from './useIsGaslessSupported';
import { useIsGaslessLoading } from './useIsGaslessLoading';

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
    gasFeeTokens,
  }: {
    simulationEnabled: boolean;
    gaslessSupported: boolean;
    insufficientBalance: boolean;
    gasFeeTokens?: object | null;
  }) => {
    mockedUseSelector.mockImplementation((selector) => {
      if (selector === getUseTransactionSimulations) {
        return simulationEnabled;
      }
      return false;
    });

    mockedUseConfirmContext.mockReturnValue({
      currentConfirmation: gasFeeTokens ? { gasFeeTokens } : {},
    } as unknown as ReturnType<typeof useConfirmContext>);

    mockedUseIsGaslessSupported.mockReturnValue({
      isSupported: gaslessSupported,
      isSmartTransaction: true,
    });

    mockedUseIsInsufficientBalance.mockReturnValue(insufficientBalance);
  };

  it('returns false if simulation is disabled', () => {
    setup({
      simulationEnabled: false,
      gaslessSupported: true,
      insufficientBalance: true,
    });

    const { result } = renderHook(() => useIsGaslessLoading());
    expect(result.current.isGaslessLoading).toBe(false);
  });

  it('returns false if gasless is not supported', () => {
    setup({
      simulationEnabled: true,
      gaslessSupported: false,
      insufficientBalance: true,
    });

    const { result } = renderHook(() => useIsGaslessLoading());
    expect(result.current.isGaslessLoading).toBe(false);
  });

  it('returns false if there is no insufficient balance', () => {
    setup({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: false,
    });

    const { result } = renderHook(() => useIsGaslessLoading());
    expect(result.current.isGaslessLoading).toBe(false);
  });

  it('returns true if gas fee tokens are undefined (still loading)', () => {
    setup({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: true,
      gasFeeTokens: undefined, // this triggers loading
    });

    const { result } = renderHook(() => useIsGaslessLoading());
    expect(result.current.isGaslessLoading).toBe(true);
  });

  it('returns false if gas fee tokens are present', () => {
    setup({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: true,
      gasFeeTokens: { tokenA: '0x123' },
    });

    const { result } = renderHook(() => useIsGaslessLoading());
    expect(result.current.isGaslessLoading).toBe(false);
  });

  it('returns true if gas fee tokens is null', () => {
    setup({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: true,
      gasFeeTokens: null,
    });

    const { result } = renderHook(() => useIsGaslessLoading());
    expect(result.current.isGaslessLoading).toBe(true);
  });
});
