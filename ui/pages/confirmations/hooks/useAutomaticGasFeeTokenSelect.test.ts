import { GasFeeToken, TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { act } from '@testing-library/react';

import { NATIVE_TOKEN_ADDRESS } from '../../../../shared/constants/transaction';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { updateSelectedGasFeeToken } from '../../../store/controller-actions/transaction-controller';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import { forceUpdateMetamaskState } from '../../../store/actions';
import { GAS_FEE_TOKEN_MOCK } from '../../../../test/data/confirmations/gas';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useAutomaticGasFeeTokenSelect } from './useAutomaticGasFeeTokenSelect';
import { useIsGaslessSupported } from './gas/useIsGaslessSupported';

jest.mock('../../../store/controller-actions/transaction-controller');
jest.mock('./alerts/transactions/useInsufficientBalanceAlerts');
jest.mock('../../../../shared/modules/selectors');
jest.mock('./gas/useIsGaslessSupported');

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  forceUpdateMetamaskState: jest.fn(),
}));

function runHook({
  gasFeeTokens,
  selectedGasFeeToken,
}: {
  gasFeeTokens?: GasFeeToken[];
  selectedGasFeeToken?: Hex;
} = {}) {
  const state = getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      gasFeeTokens: gasFeeTokens ?? [GAS_FEE_TOKEN_MOCK],
      selectedGasFeeToken,
    }),
  );

  const result = renderHookWithConfirmContextProvider(
    useAutomaticGasFeeTokenSelect,
    state,
  );

  return { ...result, state };
}

describe('useAutomaticGasFeeTokenSelect', () => {
  const updateSelectedGasFeeTokenMock = jest.mocked(updateSelectedGasFeeToken);
  const forceUpdateMetamaskStateMock = jest.mocked(forceUpdateMetamaskState);
  const useIsGaslessSupportedMock = jest.mocked(useIsGaslessSupported);

  const useInsufficientBalanceAlertsMock = jest.mocked(
    useInsufficientBalanceAlerts,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    useInsufficientBalanceAlertsMock.mockReturnValue([{} as Alert]);
    updateSelectedGasFeeTokenMock.mockResolvedValue();
    forceUpdateMetamaskStateMock.mockResolvedValue();

    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: true,
    });
  });

  it('selects first gas fee token', () => {
    runHook();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(1);
    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledWith(
      expect.any(String),
      GAS_FEE_TOKEN_MOCK.tokenAddress,
    );
  });

  it('does not select first gas fee token if gas fee token already selected', () => {
    runHook({ selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress });
    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
  });

  it('does not select first gas fee token if no gas fee tokens', () => {
    runHook({ gasFeeTokens: [] });
    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
  });

  it('does not select first gas fee token if not first load', () => {
    const { rerender, state } = runHook({
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    });

    const transactionMeta = state.metamask
      .transactions[0] as unknown as TransactionMeta;

    act(() => {
      transactionMeta.selectedGasFeeToken = undefined;
    });

    rerender();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
  });

  it('does not select first gas fee token if gasless not supported', () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: false,
      isSmartTransaction: false,
    });

    runHook();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
  });

  it('does not select first gas fee token if sufficient balance', () => {
    useInsufficientBalanceAlertsMock.mockReturnValue([]);

    runHook();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
  });

  it('does not select first gas fee token after firstCheck is set to false', () => {
    const { rerender, state } = runHook();
    // Simulate a rerender with new state that would otherwise trigger selection
    act(() => {
      (
        state.metamask.transactions[0] as unknown as TransactionMeta
      ).selectedGasFeeToken = undefined;
    });
    rerender();
    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(1); // Only first run
  });

  it('does not select if transactionId is falsy', () => {
    const state = getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
        selectedGasFeeToken: undefined,
      }),
    );
    // Remove transactionId
    state.metamask.transactions = [];
    renderHookWithConfirmContextProvider(useAutomaticGasFeeTokenSelect, state);
    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
  });

  it('does not select if gasFeeTokens is falsy', () => {
    runHook({ gasFeeTokens: [] });
    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
  });

  it('does not select first gas fee token if 7702 and future native token', () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: false,
    });

    runHook({
      gasFeeTokens: [
        {
          ...GAS_FEE_TOKEN_MOCK,
          tokenAddress: NATIVE_TOKEN_ADDRESS,
        },
      ],
    });

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
  });

  it('selects second gas fee token if 7702 and future native token', () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: false,
    });

    runHook({
      gasFeeTokens: [
        {
          ...GAS_FEE_TOKEN_MOCK,
          tokenAddress: NATIVE_TOKEN_ADDRESS,
        },
        GAS_FEE_TOKEN_MOCK,
      ],
    });

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(1);
  });
});
