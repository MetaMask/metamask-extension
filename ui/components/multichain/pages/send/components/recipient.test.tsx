import React from 'react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import {
  CONFUSING_ENS_ERROR,
  ENS_UNKNOWN_ERROR,
} from '../../../../../pages/confirmations/send/send.constants';
import { SendPageRecipient } from '.';

const render = (stateChanges = {}) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      permissionHistory: {
        'https://test.dapp': {
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1709225290848,
            },
          },
        },
      },
    },
    ...stateChanges,
    activeTab: {
      origin: 'https://test.dapp',
    },
  });
  return renderWithProvider(<SendPageRecipient />, store);
};

describe('SendPageRecipient', () => {
  describe('your accounts', () => {
    it('shows user accounts when there is no input', () => {
      const { container } = render();
      expect(
        container.querySelector('.multichain-account-list-item'),
      ).toBeInTheDocument();
    });

    it('shows user accounts when there is no input', () => {
      const { container } = render({
        send: { recipientInput: 'd', draftTransactions: {} },
      });
      expect(
        container.querySelector('.multichain-account-list-item'),
      ).toBeNull();
    });
  });

  describe('address book', () => {
    it('renders the address book tab', () => {
      const { container } = render();
      expect(
        container.querySelector('[data-testid="send-contacts-tab"]'),
      ).toBeInTheDocument();
    });
  });

  describe('errors and warnings', () => {
    it('shows an error when condition is met', () => {
      const { getByTestId } = render({ DNS: { error: ENS_UNKNOWN_ERROR } });

      expect(getByTestId('send-recipient-error')).toBeInTheDocument();
    });

    it('shows a warning when condition is met', () => {
      const { getByTestId } = render({ DNS: { warning: CONFUSING_ENS_ERROR } });

      expect(getByTestId('send-recipient-warning')).toBeInTheDocument();
    });
  });
});
