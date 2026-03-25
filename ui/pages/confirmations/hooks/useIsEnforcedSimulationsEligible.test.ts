import { TransactionMeta } from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import {
  getIsEnforcedSimulationsEligible,
  isAddressTrusted,
} from '../../../../shared/lib/transaction/enforced-simulations';
import { ResultType } from '../../../../shared/lib/trust-signals';
import { useIsEnforcedSimulationsEligible } from './useIsEnforcedSimulationsEligible';

jest.mock('../../../../shared/lib/transaction/enforced-simulations');

const getIsEnforcedSimulationsEligibleMock = jest.mocked(
  getIsEnforcedSimulationsEligible,
);

const isAddressTrustedMock = jest.mocked(isAddressTrusted);

const TO_ADDRESS = '0x88aa6343307ec9a652ccddda3646e62b2f1a5125';
const CACHE_KEY = `ethereum:${TO_ADDRESS}`;

function buildAlertResponses(resultType: ResultType): Record<string, unknown> {
  return {
    [CACHE_KEY]: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: resultType,
      label: resultType.toLowerCase(),
      timestamp: Date.now(),
    },
  };
}

function runHook({
  eligible = true,
  trusted = false,
  addressSecurityAlertResponses = {},
}: {
  eligible?: boolean;
  trusted?: boolean;
  addressSecurityAlertResponses?: Record<string, unknown>;
} = {}) {
  getIsEnforcedSimulationsEligibleMock.mockReturnValue(eligible);
  isAddressTrustedMock.mockReturnValue(trusted);

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

  it('returns isEligible true and isDefaultEnabled true when eligible, loaded, and not trusted', () => {
    const result = runHook({
      eligible: true,
      trusted: false,
      addressSecurityAlertResponses: buildAlertResponses(ResultType.Benign),
    });

    expect(result.isEligible).toBe(true);
    expect(result.isDefaultEnabled).toBe(true);
  });

  it('returns isEligible true and isDefaultEnabled false when eligible, loaded, and trusted', () => {
    const result = runHook({
      eligible: true,
      trusted: true,
      addressSecurityAlertResponses: buildAlertResponses(ResultType.Trusted),
    });

    expect(result.isEligible).toBe(true);
    expect(result.isDefaultEnabled).toBe(false);
  });

  it('returns isEligible true and isDefaultEnabled false when trust signal not loaded', () => {
    const result = runHook({
      eligible: true,
      addressSecurityAlertResponses: {},
    });

    expect(result.isEligible).toBe(true);
    expect(result.isDefaultEnabled).toBe(false);
  });

  it('returns both false when not eligible', () => {
    const result = runHook({ eligible: false });

    expect(result.isEligible).toBe(false);
    expect(result.isDefaultEnabled).toBe(false);
  });

  it('passes transaction meta to eligibility function', () => {
    runHook({ eligible: true });

    expect(getIsEnforcedSimulationsEligibleMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) }),
    );
  });

  it('passes address, chainId, and state to isAddressTrusted when loaded', () => {
    const alertResponses = buildAlertResponses(ResultType.Benign);

    runHook({
      eligible: true,
      addressSecurityAlertResponses: alertResponses,
    });

    expect(isAddressTrustedMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      { addressSecurityAlertResponses: alertResponses },
    );
  });

  it('does not call isAddressTrusted when trust signal not loaded', () => {
    runHook({
      eligible: true,
      addressSecurityAlertResponses: {},
    });

    expect(isAddressTrustedMock).not.toHaveBeenCalled();
  });
});
