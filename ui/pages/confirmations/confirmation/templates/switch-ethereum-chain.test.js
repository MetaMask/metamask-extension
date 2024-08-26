import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor } from '@testing-library/react';

import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

import Confirmation from '../confirmation';
import { mockNetworkState } from '../../../../../test/stub/networks';

jest.mock('../../../../../shared/lib/fetch-with-cache');

const middleware = [thunk];

const mockApprovalId = 1;
const mockApproval = {
  id: mockApprovalId,
  origin: 'https://test-dapp.metamask.io',
  requestData: {
    toNetworkConfiguration: {
      rpcUrl: 'https://rpcurl.test.chain',
      rpcPrefs: {
        blockExplorerUrl: 'https://blockexplorer.test.chain',
      },
      chainName: 'Test chain',
      ticker: 'TST',
      chainId: '0x9999',
      nickname: 'Test chain',
    },
    fromNetworkConfiguration: {
      type: 'rpc',
      rpcUrl: 'http://example-custom-rpc.metamask.io',
      chainId: '0x9999',
      nickname: 'Test initial state',
    },
  },
};

const mockBaseStore = {
  metamask: {
    pendingApprovals: {
      [mockApprovalId]: mockApproval,
    },
    approvalFlows: [],
    subjectMetadata: {},
    ...mockNetworkState({
      chainId: '0x9999',
      nickname: 'Test initial state',
    }),
    snaps: {},
  },
};

describe('switch-ethereum-chain confirmation', () => {
  it('should match snapshot', async () => {
    const testStore = {
      metamask: {
        ...mockBaseStore.metamask,
        pendingApprovals: {
          [mockApprovalId]: {
            ...mockApproval,
            type: MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN,
          },
        },
        transactions: [],
      },
    };
    const store = configureMockStore(middleware)(testStore);
    const { container } = renderWithProvider(<Confirmation />, store);
    await waitFor(() => {
      expect(container.querySelector('.callout')).toBeFalsy();
      expect(container).toMatchSnapshot();
    });
  });

  it('should show alert if there are pending txs', async () => {
    const testStore = {
      metamask: {
        ...mockBaseStore.metamask,
        pendingApprovals: {
          [mockApprovalId]: {
            ...mockApproval,
            type: MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN,
          },
        },
        transactions: [
          {
            id: 1,
            status: 'unapproved',
            chainId: '0x9999',
          },
        ],
      },
    };

    const store = configureMockStore(middleware)(testStore);
    const { getByText, container } = renderWithProvider(
      <Confirmation />,
      store,
    );
    await waitFor(() => {
      expect(
        getByText('Switching networks will cancel all pending confirmations'),
      ).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });
  });
});
