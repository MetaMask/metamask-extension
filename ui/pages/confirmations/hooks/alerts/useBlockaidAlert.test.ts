import { ApprovalType } from '@metamask/controller-utils';
import { SecurityAlertResponse } from '../../types/confirm';
import {
  BlockaidResultType,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import { Severity } from '../../../../helpers/constants/design-system';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import useBlockaidAlert from './useBlockaidAlert';

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

describe('useBlockaidAlert', () => {
  beforeAll(() => {
    process.env.ENABLE_CONFIRMATION_REDESIGN = 'true';
  });

  afterAll(() => {
    process.env.ENABLE_CONFIRMATION_REDESIGN = 'false';
  });

  it('returns an empty array when there is no current confirmation', () => {
    const { result } = renderHookWithProvider(
      () => useBlockaidAlert(),
      mockState,
    );
    expect(result.current).toEqual([]);
  });

  it('returns an empty array when the current confirmation is not of type PersonalSign', () => {
    const alteredState = {
      ...mockState,
      confirm: {
        ...mockState.confirm,
        currentConfirmation: {
          ...currentConfirmationMock,
          type: ApprovalType.Transaction,
        },
      },
    };
    const { result } = renderHookWithProvider(
      () => useBlockaidAlert(),
      alteredState,
    );
    expect(result.current).toEqual([]);
  });

  it('returns alerts when there is a valid PersonalSign confirmation with a security alert response', () => {
    const alertResponseExpected = {
      key: mockSecurityAlertResponse.securityAlertId,
      severity: Severity.Danger,
      message: 'If you approve this request, you might lose your assets.',
      alertDetails: mockSecurityAlertResponse.features,
      provider: SecurityProvider.Blockaid,
      reason: 'This is a deceptive request',
    };

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
    expect(result.current[0].reportUrl).toBeDefined();
    delete result.current[0].reportUrl;
    expect(result.current[0]).toStrictEqual(alertResponseExpected);
  });
});
