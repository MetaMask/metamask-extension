import { ApprovalType } from '@metamask/controller-utils';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import useConfirmationOriginAlerts from './useConfirmationOriginAlerts';

const signatureConfirmationMock = {
  id: '1',
  status: 'unapproved',
  time: new Date().getTime(),
  type: ApprovalType.PersonalSign,
  msgParams: {
    origin: 'https://iոfura.io/gnosis',
  },
};

const transactionConfirmationMock = {
  id: '1',
  status: 'unapproved',
  time: new Date().getTime(),
  type: ApprovalType.Transaction,
  origin: 'https://iոfura.io/gnosis',
};

const getMockExpectedState = (confirmationMock: Record<string, unknown>) => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    unapprovedPersonalMsgs: {
      '1': { ...confirmationMock },
    },
    pendingApprovals: {
      '1': {
        ...confirmationMock,
        origin: 'origin',
        requestData: {},
        requestState: null,
        expectsResult: false,
      },
    },
    preferences: { redesignedConfirmationsEnabled: true },
  },
  confirm: { currentConfirmation: confirmationMock },
});

const expectedAlert = [
  {
    key: 'originSpecialCharacterWarning',
    message:
      "Attackers sometimes mimic sites by making small changes to the site address. Make sure you're interacting with the intended site before you continue.",
    reason: 'Site address mismatch',
    severity: 'warning',
    alertDetails: [
      'Current URL: https://iոfura.io/gnosis',
      'Punycode version: https://xn--ifura-dig.io/gnosis',
    ],
    field: 'requestFrom',
  },
];

describe('useConfirmationOriginAlerts', () => {
  it('returns an empty array when there is no current confirmation', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationOriginAlerts(),
      mockState,
    );
    expect(result.current).toEqual([]);
  });

  it('returns an alert for signature with special characters in origin', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationOriginAlerts(),
      getMockExpectedState(signatureConfirmationMock),
    );
    expect(result.current).toEqual(expectedAlert);
  });

  it('returns an alert for transaction with special characters in origin', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationOriginAlerts(),
      getMockExpectedState(transactionConfirmationMock),
    );
    expect(result.current).toEqual(expectedAlert);
  });
});
