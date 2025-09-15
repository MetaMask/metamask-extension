import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor } from '@testing-library/react';

import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { HYPERLIQUID_APPROVAL_TYPE } from '../../../../../shared/constants/app';
import Confirmation from '../confirmation';

jest.mock('../../../../../shared/lib/fetch-with-cache');

const middleware = [thunk];
const mockApprovalId = 1;
const mockApproval = {
  id: mockApprovalId,
  origin: 'https://app.hyperliquid.xyz',
  requestData: {
    selectedAddress: '0x1234567890123456789012345678901234567890',
  },
};

const mockBaseStore = {
  metamask: {
    pendingApprovals: {
      [mockApprovalId]: mockApproval,
    },
    approvalFlows: [],
    subjectMetadata: {},
    snaps: {},
    transactions: [],
    preferences: {
      referralApprovedAccounts: [],
      referralPassedAccounts: [],
      referralDeclinedAccounts: [],
    },
  },
};

describe('hyperliquid-referral-consent template', () => {
  it('matches the snapshot', async () => {
    const testStore = {
      metamask: {
        ...mockBaseStore.metamask,
        pendingApprovals: {
          [mockApprovalId]: {
            ...mockApproval,
            type: HYPERLIQUID_APPROVAL_TYPE,
          },
        },
      },
    };
    const store = configureMockStore(middleware)(testStore);
    const { container } = renderWithProvider(<Confirmation />, store);

    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });

  it('matches the snapshot with approved state', async () => {
    const testStore = {
      metamask: {
        ...mockBaseStore.metamask,
        pendingApprovals: {
          [mockApprovalId]: {
            ...mockApproval,
            type: HYPERLIQUID_APPROVAL_TYPE,
            requestData: {
              ...mockApproval.requestData,
              approved: true,
              allAccounts: true,
            },
          },
        },
      },
    };
    const store = configureMockStore(middleware)(testStore);
    const { container } = renderWithProvider(<Confirmation />, store);

    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });
});
