import { TransactionMeta } from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { isEnforcedSimulationsEligible } from '../../../../shared/lib/transaction/enforced-simulations';
import { useIsEnforcedSimulationsEligible } from './useIsEnforcedSimulationsEligible';

jest.mock('../../../../shared/lib/transaction/enforced-simulations');

const getIsEnforcedSimulationsEligibleMock = jest.mocked(
  isEnforcedSimulationsEligible,
);

function runHook({
  eligible = true,
  addressSecurityAlertResponses = {},
}: {
  eligible?: boolean;
  addressSecurityAlertResponses?: Record<string, unknown>;
} = {}) {
  getIsEnforcedSimulationsEligibleMock.mockReturnValue(eligible);

  const transaction = genUnapprovedContractInteractionConfirmation({
    origin: 'https://some-dapp.com',
    chainId: '0x1',
  });

  const state = getMockConfirmStateForTransaction(
    transaction as unknown as TransactionMeta,
    {
      metamask: {
        addressSecurityAlertResponses,
      },
    },
  );

  const { result } = renderHookWithConfirmContextProvider(
    () => useIsEnforcedSimulationsEligible(),
    state,
  );

  return result.current;
}

describe('useIsEnforcedSimulationsEligible', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when eligible', () => {
    expect(runHook({ eligible: true })).toBe(true);
  });

  it('returns false when not eligible', () => {
    expect(runHook({ eligible: false })).toBe(false);
  });

  it('passes transaction meta and state to eligibility function', () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const alertResponses = { someKey: { result_type: 'Benign' } };

    runHook({
      eligible: true,
      addressSecurityAlertResponses: alertResponses,
    });

    expect(getIsEnforcedSimulationsEligibleMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) }),
      { addressSecurityAlertResponses: alertResponses },
    );
  });
});
