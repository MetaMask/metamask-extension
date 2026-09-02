import { act } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import mockState from '../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { usePerpsDepositConfirmation } from '../../components/app/perps/hooks/usePerpsDepositConfirmation';
import { usePerpsEligibility } from '../perps/usePerpsEligibility';
import { selectIsMoneyAccountTransactionEnabled } from '../../pages/confirmations/selectors/feature-flags';
import { PayWithOption } from '../../pages/confirmations/hooks/useConfirmationNavigation';
import { useMoneyPerpsDeposit } from './useMoneyPerpsDeposit';

jest.mock('../../components/app/perps/hooks/usePerpsDepositConfirmation');
jest.mock('../perps/usePerpsEligibility');
jest.mock('../../pages/confirmations/selectors/feature-flags', () => ({
  ...jest.requireActual('../../pages/confirmations/selectors/feature-flags'),
  selectIsMoneyAccountTransactionEnabled: jest.fn(),
}));

const usePerpsDepositConfirmationMock = jest.mocked(
  usePerpsDepositConfirmation,
);
const usePerpsEligibilityMock = jest.mocked(usePerpsEligibility);
const selectIsMoneyAccountTransactionEnabledMock = jest.mocked(
  selectIsMoneyAccountTransactionEnabled,
);

describe('useMoneyPerpsDeposit', () => {
  const triggerMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    triggerMock.mockResolvedValue({ transactionId: 'tx-1' });
    usePerpsDepositConfirmationMock.mockReturnValue({
      trigger: triggerMock,
      isLoading: false,
    });
    usePerpsEligibilityMock.mockReturnValue({ isEligible: true });
    selectIsMoneyAccountTransactionEnabledMock.mockReturnValue(true);
  });

  it('locks payWithOption to MoneyAccount when creating the deposit', () => {
    renderHookWithProvider(() => useMoneyPerpsDeposit(), mockState);

    expect(usePerpsDepositConfirmationMock).toHaveBeenCalledWith({
      payWithOption: PayWithOption.MoneyAccount,
    });
  });

  it('is enabled when eligible and the perpsDeposit money flag is on', () => {
    const { result } = renderHookWithProvider(
      () => useMoneyPerpsDeposit(),
      mockState,
    );

    expect(result.current.isEnabled).toBe(true);
    expect(selectIsMoneyAccountTransactionEnabledMock).toHaveBeenCalledWith(
      expect.anything(),
      TransactionType.perpsDeposit,
    );
  });

  it('is disabled when the user is not perps-eligible', () => {
    usePerpsEligibilityMock.mockReturnValue({ isEligible: false });

    const { result } = renderHookWithProvider(
      () => useMoneyPerpsDeposit(),
      mockState,
    );

    expect(result.current.isEnabled).toBe(false);
    expect(result.current.isEligible).toBe(false);
  });

  it('is disabled when the money-account perpsDeposit flag is off', () => {
    selectIsMoneyAccountTransactionEnabledMock.mockReturnValue(false);

    const { result } = renderHookWithProvider(
      () => useMoneyPerpsDeposit(),
      mockState,
    );

    expect(result.current.isEnabled).toBe(false);
  });

  it('initiates the money-funded perps deposit', async () => {
    const { result } = renderHookWithProvider(
      () => useMoneyPerpsDeposit(),
      mockState,
    );

    await act(async () => {
      await result.current.initiatePerpsDeposit();
    });

    expect(triggerMock).toHaveBeenCalledTimes(1);
  });
});
