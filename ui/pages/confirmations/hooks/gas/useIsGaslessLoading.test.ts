import { GasFeeToken } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';

import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { useHasInsufficientBalance } from '../useHasInsufficientBalance';
import { useIsGaslessLoading } from './useIsGaslessLoading';
import { useIsGaslessSupported } from './useIsGaslessSupported';

jest.mock('./useIsGaslessSupported');
jest.mock('../useHasInsufficientBalance');

const mockedUseIsGaslessSupported = jest.mocked(useIsGaslessSupported);
const mockedUseHasInsufficientBalance = jest.mocked(useHasInsufficientBalance);

async function runHook({
  simulationEnabled,
  gaslessSupported,
  insufficientBalance,
  pending = false,
  gasFeeTokens,
  selectedGasFeeToken,
  excludeNativeTokenForFee,
}: {
  simulationEnabled: boolean;
  gaslessSupported: boolean;
  insufficientBalance: boolean;
  pending?: boolean;
  gasFeeTokens?: GasFeeToken[];
  selectedGasFeeToken?: Hex;
  excludeNativeTokenForFee?: boolean;
}) {
  mockedUseIsGaslessSupported.mockReturnValue({
    isSupported: gaslessSupported,
    isSmartTransaction: true,
    pending,
  });
  mockedUseHasInsufficientBalance.mockReturnValue({
    hasInsufficientBalance: insufficientBalance,
    nativeCurrency: 'USD',
  });

  const { result } = renderHookWithConfirmContextProvider(
    useIsGaslessLoading,
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        gasFeeTokens,
        selectedGasFeeToken,
        excludeNativeTokenForFee,
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

  it('returns true if gasless support check is pending', async () => {
    const result = await runHook({
      simulationEnabled: true,
      gaslessSupported: false,
      insufficientBalance: true,
      pending: true,
    });

    expect(result.isGaslessLoading).toBe(true);
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

  it('returns false if gas fee tokens are present and dont match selectedGasFeeToken (non-reg)', async () => {
    const result = await runHook({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: true,
      gasFeeTokens: [{ tokenAddress: '0x123' }] as unknown as GasFeeToken[],
      selectedGasFeeToken: '0x456',
    });

    expect(result.isGaslessLoading).toBe(false);
  });

  it('returns true if gas fee tokens are present and dont match selectedGasFeeToken with excludeNativeTokenForFee being true (Tempo)', async () => {
    const result = await runHook({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: true,
      gasFeeTokens: [{ tokenAddress: '0x123' }] as unknown as GasFeeToken[],
      selectedGasFeeToken: '0x456',
      excludeNativeTokenForFee: true,
    });

    expect(result.isGaslessLoading).toBe(true);
  });

  it('returns false if gas fee tokens are present AND match selectedGasFeeToken with excludeNativeTokenForFee being true (Tempo)', async () => {
    const result = await runHook({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: true,
      gasFeeTokens: [
        { tokenAddress: '0x123' },
        { tokenAddress: '0x789' },
      ] as unknown as GasFeeToken[],
      // Matches the first one
      selectedGasFeeToken: '0x123',
      excludeNativeTokenForFee: true,
    });

    expect(result.isGaslessLoading).toBe(false);
  });

  it('returns false if gas fee tokens are present AND selectedGasFeeToken is undefined with excludeNativeTokenForFee being true (Tempo)', async () => {
    const result = await runHook({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: true,
      gasFeeTokens: [{ tokenAddress: '0x123' }] as unknown as GasFeeToken[],
      selectedGasFeeToken: undefined,
      excludeNativeTokenForFee: true,
    });

    expect(result.isGaslessLoading).toBe(false);
  });

  it('returns false if gas fee tokens are empty array with excludeNativeTokenForFee being true (Tempo)', async () => {
    const result = await runHook({
      simulationEnabled: true,
      gaslessSupported: true,
      insufficientBalance: true,
      gasFeeTokens: [] as unknown as GasFeeToken[],
      selectedGasFeeToken: '0x456',
      excludeNativeTokenForFee: true,
    });

    expect(result.isGaslessLoading).toBe(false);
  });
});
