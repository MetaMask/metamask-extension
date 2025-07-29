import { GasFeeToken } from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { useIsInsufficientBalance } from '../useIsInsufficientBalance';
import { useIsGaslessLoading } from './useIsGaslessLoading';
import { useIsGaslessSupported } from './useIsGaslessSupported';

jest.mock('./useIsGaslessSupported');
jest.mock('../useIsInsufficientBalance');

const mockedUseIsGaslessSupported = jest.mocked(useIsGaslessSupported);
const mockedUseIsInsufficientBalance = jest.mocked(useIsInsufficientBalance);

async function runHook({
  simulationEnabled,
  gaslessSupported,
  insufficientBalance,
  gasFeeTokens,
}: {
  simulationEnabled: boolean;
  gaslessSupported: boolean;
  insufficientBalance: boolean;
  gasFeeTokens?: GasFeeToken[];
}) {
  mockedUseIsGaslessSupported.mockReturnValue({
    isSupported: gaslessSupported,
    isSmartTransaction: true,
  });
  mockedUseIsInsufficientBalance.mockReturnValue(insufficientBalance);

  const { result } = renderHookWithConfirmContextProvider(
    useIsGaslessLoading,
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        gasFeeTokens,
      }),
      { metamask: { useTransactionSimulations: simulationEnabled } },
    ),
  );

  return result.current;
}

describe('useIsGaslessLoading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false if simulation is disabled', async () => {
    const result = await runHook({
      simulationEnabled: false,
      gaslessSupported: true,
      insufficientBalance: true,
    });

    expect(result.isGaslessLoading).toBe(false);
  });

  it('returns false if gasless is not supported', async () => {
    const result = await runHook({
      simulationEnabled: true,
      gaslessSupported: false,
      insufficientBalance: true,
    });

    expect(result.isGaslessLoading).toBe(false);
  });

  it('returns false if there is no insufficient balance', async () => {
    const result = await runHook({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: false,
    });

    expect(result.isGaslessLoading).toBe(false);
  });

  it('returns true if gas fee tokens are undefined (still loading)', async () => {
    const result = await runHook({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: true,
      gasFeeTokens: undefined, // this triggers loading
    });

    expect(result.isGaslessLoading).toBe(true);
  });

  it('returns false if gas fee tokens are present', async () => {
    const result = await runHook({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: true,
      gasFeeTokens: [{ tokenA: '0x123' }] as unknown as GasFeeToken[],
    });

    expect(result.isGaslessLoading).toBe(false);
  });

  it('returns false if gas fee tokens is an empty array', async () => {
    const result = await runHook({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: true,
      gasFeeTokens: [],
    });

    expect(result.isGaslessLoading).toBe(false);
  });
});
