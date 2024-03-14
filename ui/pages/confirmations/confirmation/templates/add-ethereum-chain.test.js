import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor } from '@testing-library/react';

import { NetworkStatus } from '@metamask/network-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

import Confirmation from '../confirmation';

jest.mock('../../../../../shared/lib/fetch-with-cache');

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
    approvalFlows: [{ id: mockApprovalId, loadingText: null }],
    subjectMetadata: {},
    providerConfig: {
      type: 'rpc',
      rpcUrl: 'http://example-custom-rpc.metamask.io',
      chainId: '0x9999',
      nickname: 'Test initial state',
    },
    selectedNetworkClientId: 'test-network-client-id',
    networksMetadata: {
      'test-network-client-id': {
        EIPS: {},
        status: NetworkStatus.Available,
      },
    },
    snaps: {},
  },
};

describe('add-ethereum-chain confirmation', () => {
  it('should match snapshot', async () => {
    const testStore = {
      metamask: {
        ...mockBaseStore.metamask,
        pendingApprovals: {
          [mockApprovalId]: {
            ...mockApproval,
            type: MESSAGE_TYPE.ADD_ETHEREUM_CHAIN,
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
      expect(
        getByText('MetaMask does not verify custom networks.'),
      ).toBeInTheDocument();
      expect(container.querySelector('.callout')).toBeDefined();
      expect(container).toMatchSnapshot();
    });
  });
});
