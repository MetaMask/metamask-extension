import React from 'react';
import configureStore from 'redux-mock-store';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import mockState from '../../../../../../test/data/mock-state.json';
import { BlockaidResultType } from '../../../../../../shared/constants/security-provider';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { SecurityAlertResponse } from '../../../types/confirm';
import BlockaidLoadingIndicator from './blockaid-loading-indicator';

const mockSecurityAlertResponse: SecurityAlertResponse = {
  securityAlertId: 'test-id-mock',
  reason: 'test-reason',
  result_type: BlockaidResultType.Loading,
};

const render = (
  securityAlertResponse: SecurityAlertResponse = mockSecurityAlertResponse,
) => {
  const currentConfirmationMock = {
    id: '1',
    status: TransactionStatus.unapproved,
    time: new Date().getTime(),
    type: TransactionType.personalSign,
    securityAlertResponse,
    chainId: '0x1',
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
        'test-id-mock': securityAlertResponse,
      },
    },
  };

  const defaultStore = configureStore()(mockExpectedState);
  return renderWithConfirmContextProvider(
    <BlockaidLoadingIndicator />,
    defaultStore,
  );
};

describe('BlockaidLoadingIndicator', () => {
  it('returns spinner when there blockaid validation is in progress for signature', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('returns null if blockaid validation is not in progress', () => {
    const { container } = render({
      reason: 'test-reason',
      result_type: BlockaidResultType.Benign,
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null if there is not blockaid validation response', () => {
    const { container } = render({} as SecurityAlertResponse);
    expect(container).toBeEmptyDOMElement();
  });
});
