import { ApprovalType } from '@metamask/controller-utils';
import {
  BlockaidResultType,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import { Severity } from '../../../../helpers/constants/design-system';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { SecurityAlertResponse } from '../../types/confirm';
import useBlockaidAlert from './useBlockaidAlerts';

const mockSecurityAlertResponse: SecurityAlertResponse = {
  securityAlertId: 'test-id-mock',
  reason: 'test-reason',
  result_type: BlockaidResultType.Malicious,
  features: ['Feature 1', 'Feature 2'],
};

const currentConfirmationMock = {
  id: '1',
  status: 'unapproved',
  time: new Date().getTime(),
  type: ApprovalType.PersonalSign,
  securityAlertResponse: mockSecurityAlertResponse,
};

const mockExpectedState = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    unapprovedPersonalMsgs: {
      '1': { ...currentConfirmationMock, msgParams: {} },
    },
    pendingApprovals: {
      '1': {
        ...currentConfirmationMock,
        origin: 'origin',
        requestData: {},
        requestState: null,
        expectsResult: false,
      },
    },
    preferences: { redesignedConfirmationsEnabled: true },
    signatureSecurityAlertResponses: {
      'test-id-mock': mockSecurityAlertResponse,
    },
  },
  confirm: { currentConfirmation: currentConfirmationMock },
};

const EXPECTED_ALERT = {
  key: mockSecurityAlertResponse.securityAlertId,
  severity: Severity.Danger,
  message: 'If you approve this request, you might lose your assets.',
  alertDetails: mockSecurityAlertResponse.features,
  provider: SecurityProvider.Blockaid,
  reason: 'This is a deceptive request',
};

describe('useBlockaidAlerts', () => {
  it('returns an empty array when there is no current confirmation', () => {
    const { result } = renderHookWithProvider(
      () => useBlockaidAlert(),
      mockState,
    );
    expect(result.current).toEqual([]);
  });

  it('returns alerts when there is a valid PersonalSign confirmation with a security alert response', () => {
    const { result } = renderHookWithProvider(() => useBlockaidAlert(), {
      ...mockExpectedState,
      metamask: {
        ...mockExpectedState.metamask,
        signatureSecurityAlertResponses: {
          'test-id-mock': mockSecurityAlertResponse,
        },
      },
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toStrictEqual(EXPECTED_ALERT);
  });

  it('returns alerts if confirmation is contract interaction with security alert response', () => {
    const { result } = renderHookWithProvider(() => useBlockaidAlert(), {
      ...mockExpectedState,
      metamask: {
        ...mockState.metamask,
        transactions: [
          {
            securityAlertResponse: mockSecurityAlertResponse,
          },
        ],
      },
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toStrictEqual(EXPECTED_ALERT);
  });
});
