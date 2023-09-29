import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor } from '@testing-library/react';

import Confirmation from '../confirmation';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';

const middleware = [thunk];

const mockApprovalId = 1;
const mockSnapOrigin = 'npm:@metamask/snap-test';
const mockSnapName = 'Test Snap Account Name';
const mockApproval = {
  id: mockApprovalId,
  origin: mockSnapOrigin,
  snapName: mockSnapName,
};
const mockBaseStore = {
  metamask: {
    pendingApprovals: {
      [mockApprovalId]: mockApproval,
    },
    approvalFlows: [],
    subjectMetadata: {},
  },
};

describe('create-snap-account confirmation', () => {
  it('should match snapshot', async () => {
    const testStore = {
      metamask: {
        ...mockBaseStore.metamask,
        pendingApprovals: {
          [mockApprovalId]: {
            ...mockApproval,
            type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
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
      expect(getByText(`Create Snap account`)).toBeInTheDocument();
      expect(
        getByText(
          `${mockSnapName} wants to add a new Snap account to your wallet`,
        ),
      ).toMatchInlineSnapshot(`
        <p
          class="mm-box mm-text mm-text--body-md mm-text--text-align-center mm-text--overflow-wrap-anywhere mm-box--padding-0 mm-box--sm:padding-4 mm-box--color-text-default"
          data-testid="create-snap-account-content-description"
        >
          Test Snap Account Name wants to add a new Snap account to your wallet
        </p>
      `);
      expect(container.querySelector('.callout')).toBeDefined();
      expect(container).toMatchSnapshot();
    });
  });
});
