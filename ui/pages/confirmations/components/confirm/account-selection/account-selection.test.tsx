import React from 'react';
import configureMockStore from 'redux-mock-store';
import { Hex } from '@metamask/utils';
import { fireEvent, waitFor } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { upgradeAccountConfirmation } from '../../../../../../test/data/confirmations/batch-transaction';
import { Confirmation } from '../../../types/confirm';
import { AccountSelection } from './account-selection';

jest.mock('../../../../../hooks/useMultiPolling', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));

const noop = () => undefined;

const ALL_ACCOUNTS: Hex[] = [
  '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
  '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
  '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
  '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
  '0xb552685e3d2790efd64a175b00d51f02cdafee5d',
];

describe('AccountSelection', () => {
  it('renders correctly', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const { getByText } = renderWithConfirmContextProvider(
      <AccountSelection
        selectedAccounts={[]}
        setSelectedAccounts={noop}
        closeAccountSelection={noop}
        wrapped={false}
      />,
      mockStore,
    );

    expect(getByText('Edit accounts')).toBeInTheDocument();
    expect(getByText('Test Account')).toBeInTheDocument();
    expect(getByText('Test Account 2')).toBeInTheDocument();
  });

  it('should list only evm accounts', async () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
        {
          metamask: {
            internalAccounts: {
              accounts: {
                'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                  metadata: {
                    importTime: 0,
                    name: 'Test Account',
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  scopes: ['bip122:0'],
                  type: 'bip122:p2wpkh',
                },
              },
            },
          },
        },
      ),
    );
    const { getByText, queryByText } = renderWithConfirmContextProvider(
      <AccountSelection
        selectedAccounts={[]}
        setSelectedAccounts={noop}
        closeAccountSelection={noop}
        wrapped={false}
      />,
      mockStore,
    );

    expect(getByText('Edit accounts')).toBeInTheDocument();
    await waitFor(() => {
      expect(queryByText('Test Account')).toBeNull();
    });
  });

  it('should call closeAccountSelection when close button is clicked', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const mockCloseAccountSelection = jest.fn();
    const { getByTestId } = renderWithConfirmContextProvider(
      <AccountSelection
        selectedAccounts={[]}
        setSelectedAccounts={noop}
        closeAccountSelection={mockCloseAccountSelection}
        wrapped={false}
      />,
      mockStore,
    );
    fireEvent.click(getByTestId('account-selection-close'));
    expect(mockCloseAccountSelection).toHaveBeenCalled();
  });

  it('should return list of all accounts when select all is clicked to select all accounts', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const mocksetSelectedAccounts = jest.fn();
    const { getAllByRole } = renderWithConfirmContextProvider(
      <AccountSelection
        selectedAccounts={[]}
        setSelectedAccounts={mocksetSelectedAccounts}
        closeAccountSelection={noop}
        wrapped={false}
      />,
      mockStore,
    );
    fireEvent.click(getAllByRole('checkbox')[0]);
    expect(mocksetSelectedAccounts).toHaveBeenCalledTimes(1);
    expect(mocksetSelectedAccounts).toHaveBeenCalledWith(ALL_ACCOUNTS);
  });

  it('should return list of all accounts when select all is clicked to de-select all accounts', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const mocksetSelectedAccounts = jest.fn();
    const { getAllByRole } = renderWithConfirmContextProvider(
      <AccountSelection
        selectedAccounts={ALL_ACCOUNTS}
        setSelectedAccounts={mocksetSelectedAccounts}
        closeAccountSelection={noop}
        wrapped={false}
      />,
      mockStore,
    );
    fireEvent.click(getAllByRole('checkbox')[0]);
    expect(mocksetSelectedAccounts).toHaveBeenCalledTimes(1);
    expect(mocksetSelectedAccounts).toHaveBeenCalledWith([]);
  });

  it('call onUpdate when update button is clicked', async () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const mockOnUpdate = jest.fn();
    const { getByRole } = renderWithConfirmContextProvider(
      <AccountSelection
        selectedAccounts={ALL_ACCOUNTS}
        setSelectedAccounts={noop}
        closeAccountSelection={noop}
        onUpdate={mockOnUpdate}
        wrapped={false}
      />,
      mockStore,
    );
    fireEvent.click(
      getByRole('button', {
        name: /Update/iu,
      }),
    );
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
  });
});
