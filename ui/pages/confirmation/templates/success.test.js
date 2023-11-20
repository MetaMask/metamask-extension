import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor } from '@testing-library/react';

import { ApprovalType } from '@metamask/controller-utils';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import Confirmation from '../confirmation';

jest.mock('../../../../shared/lib/fetch-with-cache');

const middleware = [thunk];
const mockApprovalId = 1;
const mockApproval = {
  id: mockApprovalId,
  origin: 'https://test-dapp.metamask.io',
  requestData: {
    header: [
      {
        key: 'headerText',
        name: 'Typography',
        children: 'Success mock',
        properties: {
          variant: 'h2',
          class: 'header-mock-class',
        },
      },
    ],
    message: 'Success message',
  },
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

describe('success template', () => {
  it('matches the snapshot', async () => {
    const testStore = {
      metamask: {
        ...mockBaseStore.metamask,
        pendingApprovals: {
          [mockApprovalId]: {
            ...mockApproval,
            type: ApprovalType.ResultSuccess,
          },
        },
        providerConfig: {
          chainId: '0x1',
        },
        transactions: [],
      },
    };
    const store = configureMockStore(middleware)(testStore);
    const { getByText, container } = renderWithProvider(
      <Confirmation />,
      store,
    );
    await waitFor(() => {
      expect(getByText('Success mock')).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });
  });
});
