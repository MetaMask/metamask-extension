import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { act } from '@testing-library/react';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { updateSelectedGasFeeToken } from '../../../store/controller-actions/transaction-controller';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import { forceUpdateMetamaskState } from '../../../store/actions';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import { GAS_FEE_TOKEN_MOCK } from '../../../../test/data/confirmations/gas';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useAutomaticGasFeeTokenSelect } from './useAutomaticGasFeeTokenSelect';

jest.mock('../../../store/controller-actions/transaction-controller');
jest.mock('./alerts/transactions/useInsufficientBalanceAlerts');
jest.mock('../../../../shared/modules/selectors');

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  forceUpdateMetamaskState: jest.fn(),
}));

function runHook({
  noGasFeeTokens,
  selectedGasFeeToken,
}: {
  maxFeePerGas?: Hex;
  noGasFeeTokens?: boolean;
  selectedGasFeeToken?: Hex;
  value?: Hex;
} = {}) {
  const state = getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      gasFeeTokens: noGasFeeTokens ? undefined : [GAS_FEE_TOKEN_MOCK],
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
  const getIsSmartTransactionMock = jest.mocked(getIsSmartTransaction);

  const useInsufficientBalanceAlertsMock = jest.mocked(
    useInsufficientBalanceAlerts,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    useInsufficientBalanceAlertsMock.mockReturnValue([{} as Alert]);
    updateSelectedGasFeeTokenMock.mockResolvedValue();
    forceUpdateMetamaskStateMock.mockResolvedValue();
    getIsSmartTransactionMock.mockReturnValue(true);
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
    runHook({ noGasFeeTokens: true });
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

  it('does not select first gas fee token if not smart transaction', () => {
    getIsSmartTransactionMock.mockReturnValue(false);

    runHook();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
  });

  it('does not select first gas fee token if sufficient balance', () => {
    useInsufficientBalanceAlertsMock.mockReturnValue([]);

    runHook();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
  });
});
