import React from 'react';
import configureStore from 'redux-mock-store';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';

import NetworkChangeToastLegacy from './network-change-toast-legacy';

const render = () => {
  const currentConfirmationMock = {
    id: '1',
    status: TransactionStatus.unapproved,
    time: new Date().getTime(),
    type: TransactionType.personalSign,
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
    },
  };

  const defaultStore = configureStore()(mockExpectedState);
  return renderWithProvider(
    <NetworkChangeToastLegacy confirmation={currentConfirmationMock} />,
    defaultStore,
  );
};

describe('NetworkChangeToast', () => {
  it('render without throwing error', () => {
    expect(() => {
      const { container } = render();
      expect(container).toBeEmptyDOMElement();
    }).not.toThrow();
  });
});
