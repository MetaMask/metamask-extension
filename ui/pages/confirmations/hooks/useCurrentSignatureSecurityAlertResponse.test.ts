import { TransactionType } from '@metamask/transaction-controller';

import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { getMockPersonalSignConfirmStateForRequest } from '../../../../test/data/confirmations/helper';
import { BlockaidResultType } from '../../../../shared/constants/security-provider';
import { SecurityAlertResponse } from '../types/confirm';
import useCurrentSignatureSecurityAlertResponse from './useCurrentSignatureSecurityAlertResponse';

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
  type: TransactionType.personalSign,
  securityAlertResponse: mockSecurityAlertResponse,
};

const getMockCurrentState = () =>
  getMockPersonalSignConfirmStateForRequest(currentConfirmationMock, {
    metamask: {
      signatureSecurityAlertResponses: {
        'test-id-mock': mockSecurityAlertResponse,
      },
    },
  });

describe('useCurrentSignatureSecurityAlertResponse', () => {
  it('returns security alert response for current signature request', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useCurrentSignatureSecurityAlertResponse(),
      getMockCurrentState(),
    );
    expect(result.current).toEqual(mockSecurityAlertResponse);
  });
});
