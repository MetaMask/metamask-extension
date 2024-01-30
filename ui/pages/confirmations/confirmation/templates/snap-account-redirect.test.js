import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor } from '@testing-library/react';

import Confirmation from '../confirmation';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../../shared/constants/app';

const middleware = [thunk];

const mockApprovalId = 1;
const mockSnapName = 'Test Snap Account Name';
const mockUrl = 'https://metamask.github.io/test-snap';
const mockMessage = 'Test Snap Account Message';
const mockIsBlockedUrl = false;
const providerConfig = {
  chainId: '0x5',
};
const mockApproval = {
  id: mockApprovalId,
  snapName: mockSnapName,
  requestData: {
    url: mockUrl,
    message: mockMessage,
    isBlockedUrl: mockIsBlockedUrl,
  },
};
const mockBaseStore = {
  metamask: {
    pendingApprovals: {
      [mockApprovalId]: mockApproval,
    },
    approvalFlows: [],
    subjectMetadata: {},
    providerConfig,
  },
};

describe('snap-account-redirect confirmation', () => {
  it('should match snapshot', async () => {
    const testStore = {
      metamask: {
        ...mockBaseStore.metamask,
        pendingApprovals: {
          [mockApprovalId]: {
            ...mockApproval,
            type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
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
      expect(getByText(`Finish signing`)).toBeInTheDocument();
      expect(
        getByText(`Follow the instructions from ${mockSnapName}`),
      ).toBeInTheDocument();
      expect(getByText('Test Snap Account Message')).toBeInTheDocument();
      expect(container.querySelector('.callout')).toBeDefined();
      expect(container).toMatchSnapshot();
    });
  });
});
