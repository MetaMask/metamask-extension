import React from 'react';
import { EthAccountType, KeyringAccountType } from '@metamask/keyring-api';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { EditAccountsModal } from '.';

const render = (
  props: {
    onClose: () => void;
    allowedAccountTypes: KeyringAccountType[];
  } = {
    onClose: () => jest.fn(),
    allowedAccountTypes: [EthAccountType.Eoa, EthAccountType.Erc4337],
  },
  state = {},
) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...state,
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
  return renderWithProvider(<EditAccountsModal {...props} />, store);
};
describe('EditAccountsModal', () => {
  it('should render correctly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('shows select all button', async () => {
    const { getByLabelText } = render();
    expect(getByLabelText('Select all')).toBeInTheDocument();
  });
});
