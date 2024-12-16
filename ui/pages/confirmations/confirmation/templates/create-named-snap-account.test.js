import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor } from '@testing-library/react';

import { KeyringTypes } from '@metamask/keyring-controller';
import Confirmation from '../confirmation';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../../shared/constants/app';
import mockState from '../../../../../test/data/mock-state.json';
import { ETH_EOA_METHODS } from '../../../../../shared/constants/eth-methods';

const middleware = [thunk];

const mockApprovalId = 1;
const mockSnapOrigin = 'npm:@metamask/snap-test';
const mockSnapName = 'Test Snap Account Name';
const mockTemporaryAccount = {
  address: '0x3f9658179a5c053bb2faaf7badbb95f6c9be0fa7',
  id: 'a47c9b67-1234-4d58-9321-4aee3b6c8e45',
  metadata: {
    name: 'Snap Account 2',
    keyring: {
      type: 'Snap Keyring',
    },
    snap: {
      id: 'snap-id',
      name: 'snap-name',
    },
  },
  options: {},
  methods: ETH_EOA_METHODS,
  type: 'eip155:eoa',
  balance: '0x0',
};
const mockApproval = {
  id: mockApprovalId,
  origin: mockSnapOrigin,
  snapName: mockSnapName,
  requestData: {
    address: mockTemporaryAccount.address,
    snapSuggestedAccountName: 'Suggested Account Name',
  },
};

const updatedKeyrings = mockState.metamask.keyrings.map((keyring) => {
  if (keyring.type === KeyringTypes.snap) {
    return {
      ...keyring,
      accounts: [...keyring.accounts, mockTemporaryAccount.address],
    };
  }
  return keyring;
});

const mockBaseStore = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    keyrings: updatedKeyrings,
    accounts: {
      ...mockState.metamask.accounts,
      [mockTemporaryAccount.address]: {
        balance: mockTemporaryAccount.balance,
        address: mockTemporaryAccount.address,
      },
    },
    internalAccounts: {
      ...mockState.metamask.internalAccounts,
      accounts: {
        ...mockState.metamask.internalAccounts.accounts,
        [mockTemporaryAccount.id]: mockTemporaryAccount,
      },
    },
    snaps: {
      ...mockState.metamask.snaps,
      [mockSnapOrigin]: {
        id: mockSnapOrigin,
        manifest: {
          proposedName: 'Test Snap',
          description: 'Test Snap',
        },
      },
    },
    pendingApprovals: {
      ...mockState.metamask.pendingApprovals,
      [mockApprovalId]: mockApproval,
    },
    approvalFlows: [],
    subjectMetadata: {},
  },
};

const render = (approval = mockApproval) => {
  const testStore = {
    ...mockBaseStore,
    metamask: {
      ...mockBaseStore.metamask,
      pendingApprovals: {
        ...mockBaseStore.metamask.pendingApprovals,
        [mockApprovalId]: {
          ...approval,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
        },
      },
    },
  };
  const store = configureMockStore(middleware)(testStore);
  const confirmation = renderWithProvider(<Confirmation />, store);
  return confirmation;
};

describe('create-named-snap-account confirmation', () => {
  it('matches snapshot', async () => {
    const { container, getByText } = render();
    await waitFor(() => {
      expect(getByText('Add account')).toBeInTheDocument();
      expect(container.querySelector('.callout')).toBeDefined();
      expect(container).toMatchSnapshot();
    });
  });

  it('will show CreateBTCAccount component if the account is a BTC account', async () => {
    const { getByPlaceholderText } = render({
      ...mockApproval,
      requestData: {
        snapSuggestedAccountName: 'Bitcoin Account',
        address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      },
    });
    await waitFor(() => {
      expect(getByPlaceholderText('Bitcoin Account')).toBeInTheDocument();
    });
  });
});
