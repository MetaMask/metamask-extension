import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor } from '@testing-library/react';

import Confirmation from '../confirmation';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../../shared/constants/app';
import mockState from '../../../../../test/data/mock-state.json';

const middleware = [thunk];

const mockApprovalId = 1;
const mockSnapOrigin = 'npm:@metamask/snap-test';
const mockSnapName = 'Test Snap Account Name';
const mockApproval = {
  id: mockApprovalId,
  origin: mockSnapOrigin,
  snapName: mockSnapName,
  requestData: {
    address: '0x2a4d4b667D5f12C3F9Bf8F14a7B9f8D8d9b8c8fA',
    snapSuggestedAccountName: 'Suggested Account Name',
  },
};
const mockBaseStore = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
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

describe('create-named-snap-account confirmation', () => {
  it('matches snapshot', async () => {
    const testStore = {
      ...mockBaseStore,
      metamask: {
        ...mockBaseStore.metamask,
        pendingApprovals: {
          ...mockBaseStore.metamask.pendingApprovals,
          [mockApprovalId]: {
            ...mockApproval,
            type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
          },
        },
      },
    };
    const store = configureMockStore(middleware)(testStore);
    const { container, getByText } = renderWithProvider(
      <Confirmation />,
      store,
    );
    await waitFor(() => {
      expect(getByText('Add account')).toBeInTheDocument();
      expect(container.querySelector('.callout')).toBeDefined();
      expect(container).toMatchSnapshot();
    });
  });
});
