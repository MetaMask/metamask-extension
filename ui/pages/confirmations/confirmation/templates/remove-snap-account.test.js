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
const mockPublicAddress = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const providerConfig = {
  chainId: '0x5',
  nickname: '',
};
const mockApproval = {
  id: mockApprovalId,
  origin: mockSnapOrigin,
  snapName: mockSnapName,
  requestData: {
    publicAddress: mockPublicAddress,
  },
};
const mockBaseStore = {
  metamask: {
    ...mockState.metamask,
    snaps: {
      [mockSnapOrigin]: {
        id: mockSnapOrigin,
        manifest: {
          description: 'Test Snap',
        },
      },
    },
    pendingApprovals: {
      [mockApprovalId]: mockApproval,
    },
    approvalFlows: [],
    subjectMetadata: {},
    providerConfig,
  },
};

describe('remove-snap-account confirmation', () => {
  it('should match snapshot', async () => {
    const testStore = {
      metamask: {
        ...mockBaseStore.metamask,
        pendingApprovals: {
          [mockApprovalId]: {
            ...mockApproval,
            type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
          },
        },
      },
      activeTab: {
        origin: 'https://uniswap.org/',
      },
    };
    const store = configureMockStore(middleware)(testStore);
    const { container, getByText } = renderWithProvider(
      <Confirmation />,
      store,
    );
    await waitFor(() => {
      expect(getByText(`Remove account`)).toBeInTheDocument();
      expect(container.querySelector('.callout')).toBeDefined();
      expect(container).toMatchSnapshot();
    });
  });
});
