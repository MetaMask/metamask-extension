import React from 'react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { fireEvent, renderWithProvider } from '../../../../../../test/jest';
import { SendPageYourAccounts } from '.';

const mockUpdateRecipient = jest.fn();
const mockAddHistoryEntry = jest.fn();
const mockUpdateRecipientUserInput = jest.fn();

jest.mock('../../../../../ducks/send', () => ({
  addHistoryEntry: () => mockAddHistoryEntry,
  updateRecipient: () => mockUpdateRecipient,
  updateRecipientUserInput: () => mockUpdateRecipientUserInput,
}));

const render = (props = {}) => {
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
    activeTab: {
      origin: 'https://test.dapp',
    },
  });
  return renderWithProvider(<SendPageYourAccounts {...props} />, store);
};

describe('SendPageYourAccounts', () => {
  describe('render', () => {
    it('renders correctly', () => {
      const { container } = render();
      expect(container).toMatchSnapshot();
    });
  });

  describe('actions', () => {
    it('sets the recipient upon item click', () => {
      render();

      const firstItem = document.querySelector('.multichain-account-list-item');
      if (firstItem) {
        fireEvent.click(firstItem);
        expect(mockAddHistoryEntry).toHaveBeenCalled();
        expect(mockUpdateRecipient).toHaveBeenCalled();
        expect(mockUpdateRecipientUserInput).toHaveBeenCalled();
      }
    });
  });
});
