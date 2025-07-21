import React from 'react';
import { BtcAccountType } from '@metamask/keyring-api';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { fireEvent, renderWithProvider } from '../../../../../../test/jest';
import { createMockInternalAccount } from '../../../../../../test/jest/mocks';
import { MultichainNativeAssets } from '../../../../../../shared/constants/multichain/assets';
import { SendPageYourAccounts } from '.';

const mockUpdateRecipient = jest.fn();
const mockAddHistoryEntry = jest.fn();
const mockUpdateRecipientUserInput = jest.fn();

jest.mock('../../../../../ducks/send', () => ({
  addHistoryEntry: () => mockAddHistoryEntry,
  updateRecipient: () => mockUpdateRecipient,
  updateRecipientUserInput: () => mockUpdateRecipientUserInput,
}));

const render = (props = {}, state = {}) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...state,
      permissionHistory: {
        'https://test.dapp': {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
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

  describe('Multichain', () => {
    it('does not render BTC accounts', () => {
      const mockAccount = createMockInternalAccount();
      const mockBtcAccount = createMockInternalAccount({
        address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        type: BtcAccountType.P2wpkh,
        name: 'Btc Account',
      });
      const { queryByText } = render(
        {},
        {
          internalAccounts: {
            accounts: {
              [mockAccount.id]: mockAccount,
              [mockBtcAccount.id]: mockBtcAccount,
            },
            selectedAccount: mockAccount.id,
          },
          keyrings: [
            {
              type: 'HD Key Tree',
              accounts: [mockAccount.address],
              metadata: {
                id: 'mock-keyring-id-1',
                name: '',
              },
            },
            {
              type: 'Snap Keyring',
              accounts: [mockBtcAccount.address],
              metadata: {
                id: 'mock-keyring-id-2',
                name: '',
              },
            },
          ],
          balances: {
            [mockBtcAccount.id]: {
              [MultichainNativeAssets.BITCOIN]: {
                amount: '1.00000000',
                unit: 'BTC',
              },
            },
          },
        },
      );

      expect(queryByText(mockAccount.metadata.name)).toBeInTheDocument();
      expect(queryByText(mockBtcAccount.metadata.name)).not.toBeInTheDocument();
    });
  });
});
