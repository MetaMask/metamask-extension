/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionMeta } from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import {
  hasPendingEnforcedSimulationsTrustSignals,
  isEnforcedSimulationsDefaultEnabled,
  isEnforcedSimulationsEligible,
} from '../../../../shared/lib/transaction/enforced-simulations';
import { useIsHardwareWalletAccount } from '../../../hooks/useIsHardwareWalletAccount';
import { useEnforcedSimulationsEligibility } from './useEnforcedSimulationsEligibility';

jest.mock('../../../../shared/lib/transaction/enforced-simulations', () => ({
  ...jest.requireActual(
    '../../../../shared/lib/transaction/enforced-simulations',
  ),
  hasPendingEnforcedSimulationsTrustSignals: jest.fn(),
  isEnforcedSimulationsDefaultEnabled: jest.fn(),
  isEnforcedSimulationsEligible: jest.fn(),
}));

jest.mock('../../../hooks/useIsHardwareWalletAccount');

const hasPendingEnforcedSimulationsTrustSignalsMock = jest.mocked(
  hasPendingEnforcedSimulationsTrustSignals,
);
const isEnforcedSimulationsDefaultEnabledMock = jest.mocked(
  isEnforcedSimulationsDefaultEnabled,
);
const isEnforcedSimulationsEligibleMock = jest.mocked(
  isEnforcedSimulationsEligible,
);

const useIsHardwareWalletAccountMock = jest.mocked(useIsHardwareWalletAccount);

function runHook({
  eligible = true,
  defaultEnabled = false,
  enabled = true,
  isHardwareWalletAccount = false,
  addressSecurityAlertResponses = {},
  hasPendingTrustSignals = false,
}: {
  eligible?: boolean;
  defaultEnabled?: boolean;
  enabled?: boolean;
  isHardwareWalletAccount?: boolean;
  addressSecurityAlertResponses?: Record<string, unknown>;
  hasPendingTrustSignals?: boolean;
} = {}) {
  hasPendingEnforcedSimulationsTrustSignalsMock.mockReturnValue(
    hasPendingTrustSignals,
  );
  isEnforcedSimulationsEligibleMock.mockReturnValue(eligible);
  isEnforcedSimulationsDefaultEnabledMock.mockReturnValue(defaultEnabled);
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
    () => useEnforcedSimulationsEligibility(),
    state,
  );

  return result.current;
}

describe('useEnforcedSimulationsEligibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIsHardwareWalletAccountMock.mockReturnValue(false);
  });

  it('returns eligible and disabled by default for an eligible benign transaction', () => {
    expect(runHook({ eligible: true, defaultEnabled: false })).toStrictEqual({
      isEligible: true,
      isDefaultEnabled: false,
      hasPendingTrustSignals: false,
    });
  });

  it('returns eligible and enabled by default for an eligible warning or malicious transaction', () => {
    expect(runHook({ eligible: true, defaultEnabled: true })).toStrictEqual({
      isEligible: true,
      isDefaultEnabled: true,
      hasPendingTrustSignals: false,
    });
  });

  it('defers the default check while a relevant trust signal is pending', () => {
    expect(
      runHook({
        eligible: true,
        defaultEnabled: true,
        hasPendingTrustSignals: true,
      }),
    ).toStrictEqual({
      isEligible: true,
      isDefaultEnabled: false,
      hasPendingTrustSignals: true,
    });
    expect(isEnforcedSimulationsDefaultEnabledMock).not.toHaveBeenCalled();
  });

  it('returns both values false and skips the default check when not eligible', () => {
    expect(runHook({ eligible: false, defaultEnabled: true })).toStrictEqual({
      isEligible: false,
      isDefaultEnabled: false,
      hasPendingTrustSignals: false,
    });
    expect(isEnforcedSimulationsDefaultEnabledMock).not.toHaveBeenCalled();
  });

  it('passes transaction meta and state to eligibility and default functions', () => {
    const alertResponses = { someKey: { result_type: 'Benign' } };

    runHook({
      eligible: true,
      addressSecurityAlertResponses: alertResponses,
    });

    const expectedTransaction = expect.objectContaining({
      id: expect.any(String),
    });
    const expectedState = {
      addressSecurityAlertResponses: alertResponses,
      eip7702SupportedChains: [],
      internalAddresses: expect.any(Array),
    };

    expect(isEnforcedSimulationsEligibleMock).toHaveBeenCalledWith(
      expectedTransaction,
      expectedState,
    );
    expect(isEnforcedSimulationsDefaultEnabledMock).toHaveBeenCalledWith(
      expectedTransaction,
      expectedState,
    );
  });

  it('returns both values false and skips checks when the flag is disabled', () => {
    expect(runHook({ enabled: false })).toStrictEqual({
      isEligible: false,
      isDefaultEnabled: false,
      hasPendingTrustSignals: false,
    });
    expect(isEnforcedSimulationsEligibleMock).not.toHaveBeenCalled();
    expect(isEnforcedSimulationsDefaultEnabledMock).not.toHaveBeenCalled();
  });

  it('returns both values false and skips checks for hardware wallet accounts', () => {
    expect(
      runHook({ eligible: true, isHardwareWalletAccount: true }),
    ).toStrictEqual({
      isEligible: false,
      isDefaultEnabled: false,
      hasPendingTrustSignals: false,
    });
    expect(isEnforcedSimulationsEligibleMock).not.toHaveBeenCalled();
    expect(isEnforcedSimulationsDefaultEnabledMock).not.toHaveBeenCalled();
  });
});
