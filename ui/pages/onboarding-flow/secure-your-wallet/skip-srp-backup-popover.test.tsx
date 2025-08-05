import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SkipSRPBackup from './skip-srp-backup-popover';

describe('SkipSRPBackup', () => {
  const mockStore = {
    metamask: {
      internalAccounts: {
        accounts: {
          accountId: {
            address: '0x0000000000000000000000000000000000000000',
            metadata: {
              keyring: 'HD Key Tree',
            },
          },
        },
        selectedAccount: 'accountId',
      },
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: ['0x0000000000000000000000000000000000000000'],
        },
      ],
    },
    localeMessages: {
      currentLocale: 'en',
    },
  };

  const store = configureMockStore([thunk])(mockStore);

  it('should render', async () => {
    const { getByTestId } = renderWithProvider(
      <SkipSRPBackup onClose={jest.fn()} secureYourWallet={jest.fn()} />,
      store,
    );

    const checkbox = getByTestId('skip-srp-backup-checkbox');
    expect(checkbox).toBeInTheDocument();

    const confirmSkip = getByTestId('skip-srp-backup-button');
    expect(confirmSkip).toBeInTheDocument();
    expect(confirmSkip).toBeDisabled();

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(confirmSkip).toBeEnabled();
    });
  });
});
