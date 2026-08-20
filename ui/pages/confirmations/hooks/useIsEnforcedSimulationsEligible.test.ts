/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionMeta } from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { isEnforcedSimulationsEligible } from '../../../../shared/lib/transaction/enforced-simulations';
import { useIsHardwareWalletAccount } from '../../../hooks/useIsHardwareWalletAccount';
import { useIsEnforcedSimulationsEligible } from './useIsEnforcedSimulationsEligible';

jest.mock('../../../../shared/lib/transaction/enforced-simulations', () => ({
  ...jest.requireActual(
    '../../../../shared/lib/transaction/enforced-simulations',
  ),
  isEnforcedSimulationsEligible: jest.fn(),
}));

jest.mock('../../../hooks/useIsHardwareWalletAccount');

const getIsEnforcedSimulationsEligibleMock = jest.mocked(
  isEnforcedSimulationsEligible,
);

const useIsHardwareWalletAccountMock = jest.mocked(useIsHardwareWalletAccount);

function runHook({
  eligible = true,
  enabled = true,
  isHardwareWalletAccount = false,
  addressSecurityAlertResponses = {},
}: {
  eligible?: boolean;
  enabled?: boolean;
  isHardwareWalletAccount?: boolean;
  addressSecurityAlertResponses?: Record<string, unknown>;
} = {}) {
  getIsEnforcedSimulationsEligibleMock.mockReturnValue(eligible);
  useIsHardwareWalletAccountMock.mockReturnValue(isHardwareWalletAccount);

  const transaction = genUnapprovedContractInteractionConfirmation({
    origin: 'https://some-dapp.com',
    chainId: '0x1',
  });

  const state = getMockConfirmStateForTransaction(
    transaction as unknown as TransactionMeta,
    {
      metamask: {
        addressSecurityAlertResponses,
        remoteFeatureFlags: {
          confirmations_enforced_simulations: { enabled },
        },
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
    useIsHardwareWalletAccountMock.mockReturnValue(false);
  });

  it('returns true when eligible', () => {
    expect(runHook({ eligible: true })).toBe(true);
  });

  it('returns false when not eligible', () => {
    expect(runHook({ eligible: false })).toBe(false);
  });

  it('passes transaction meta and state to eligibility function', () => {
    const alertResponses = { someKey: { result_type: 'Benign' } };

    runHook({
      eligible: true,
      addressSecurityAlertResponses: alertResponses,
    });

    expect(getIsEnforcedSimulationsEligibleMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) }),
      {
        addressSecurityAlertResponses: alertResponses,
        eip7702SupportedChains: [],
        internalAddresses: expect.any(Array),
      },
    );
  });

  it('returns false and skips the eligibility check when the flag is disabled', () => {
    expect(runHook({ enabled: false })).toBe(false);
    expect(getIsEnforcedSimulationsEligibleMock).not.toHaveBeenCalled();
  });

  it('returns false and skips the eligibility check for hardware wallet accounts', () => {
    expect(runHook({ eligible: true, isHardwareWalletAccount: true })).toBe(
      false,
    );
    expect(getIsEnforcedSimulationsEligibleMock).not.toHaveBeenCalled();
  });
});
