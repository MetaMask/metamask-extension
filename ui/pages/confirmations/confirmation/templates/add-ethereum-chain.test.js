import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor, act } from '@testing-library/react';

import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

import Confirmation from '../confirmation';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import fetchWithCache from '../../../../../shared/lib/fetch-with-cache';
import { mockNetworkState } from '../../../../../test/stub/networks';

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
    ...mockNetworkState({
      rpcUrl: 'http://example-custom-rpc.metamask.io',
      chainId: '0x9999',
      nickname: 'Test initial state',
    }),
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

  it('should show deprecation alert', async () => {
    const testStore = {
      metamask: {
        ...mockBaseStore.metamask,
        useSafeChainsListValidation: true,
        pendingApprovals: {
          [mockApprovalId]: {
            ...mockApproval,
            requestData: {
              rpcUrl: 'https://rpcurl.test.chain',
              rpcPrefs: {
                blockExplorerUrl: 'https://blockexplorer.test.chain',
              },
              chainName: 'Test chain',
              ticker: 'TST',
              chainId: CHAIN_IDS.LINEA_GOERLI, // mumbai chainId
              nickname: 'Test chain',
            },
            type: MESSAGE_TYPE.ADD_ETHEREUM_CHAIN,
          },
        },
      },
    };

    const store = configureMockStore(middleware)(testStore);
    fetchWithCache.mockResolvedValue([
      {
        name: 'Linea Goerli',
        title: 'Linea Goerli Testnet',
        shortName: 'linea-goerli',
        chainId: 59140,
      },
    ]);

    let result;
    act(() => {
      result = renderWithProvider(<Confirmation />, store);
    });
    const { getByText } = result;

    await waitFor(() => {
      expect(getByText('This network is deprecated')).toBeInTheDocument();
    });
  });

  it('should convert RPC URL to lowercase', async () => {
    const testStore = {
      metamask: {
        ...mockBaseStore.metamask,
        pendingApprovals: {
          [mockApprovalId]: {
            ...mockApproval,
            type: MESSAGE_TYPE.ADD_ETHEREUM_CHAIN,
            requestData: {
              ...mockApproval.requestData,
              rpcUrl: 'https://RPCURL.test.chain',
            },
          },
        },
      },
    };
    const store = configureMockStore(middleware)(testStore);
    const { getByText } = renderWithProvider(<Confirmation />, store);
    await waitFor(() => {
      expect(getByText('https://rpcurl.test.chain')).toBeInTheDocument();
    });
  });

  it('should show warning if RPC URL has special characters', async () => {
    const testStore = {
      metamask: {
        ...mockBaseStore.metamask,
        pendingApprovals: {
          [mockApprovalId]: {
            ...mockApproval,
            type: MESSAGE_TYPE.ADD_ETHEREUM_CHAIN,
            requestData: {
              ...mockApproval.requestData,
              rpcUrl: 'https://iոfura.io/gnosis',
            },
          },
        },
      },
    };
    const store = configureMockStore(middleware)(testStore);
    const { getByText } = renderWithProvider(<Confirmation />, store);
    await waitFor(() => {
      expect(
        getByText(
          "Attackers sometimes mimic sites by making small changes to the site address. Make sure you're interacting with the intended site before you continue. Punycode version: https://xn--ifura-dig.io/gnosis",
        ),
      ).toBeInTheDocument();
    });
  });
});
