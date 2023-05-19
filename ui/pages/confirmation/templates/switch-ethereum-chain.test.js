import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor } from '@testing-library/react';

import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';

import Confirmation from '../confirmation';

jest.mock('../../../../shared/lib/fetch-with-cache');

const middleware = [thunk];

const mockApprovalId = 1;
const mockApproval = {
  id: mockApprovalId,
  origin: 'https://test-dapp.metamask.io',
  requestData: {
    rpcUrl: 'https://rpcurl.test.chain',
    rpcPrefs: {
      blockExplorerUrl: 'https://blockexplorer.test.chain',
    },
    chainName: 'Test chain',
    ticker: 'TST',
    chainId: '0x9999',
    nickname: 'Test chain',
  },
};

const mockBaseStore = {
  metamask: {
    pendingApprovals: {
      [mockApprovalId]: mockApproval,
    },
    subjectMetadata: {},
    providerConfig: {
      type: 'rpc',
      rpcUrl: 'http://example-custom-rpc.metamask.io',
      chainId: '0x9999',
      nickname: 'Test initial state',
    },
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
        unapprovedTxs: {
          1: {
            id: 1,
          },
        },
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
