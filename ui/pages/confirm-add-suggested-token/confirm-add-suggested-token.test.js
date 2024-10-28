import React from 'react';
import { act } from 'react-dom/test-utils';
import { fireEvent, screen } from '@testing-library/react';
import { ApprovalType } from '@metamask/controller-utils';
import { EthAccountType } from '@metamask/keyring-api';
import {
  resolvePendingApproval,
  rejectPendingApproval,
} from '../../store/actions';
import configureStore from '../../store/store';
import { renderWithProvider } from '../../../test/jest/rendering';
import { ETH_EOA_METHODS } from '../../../shared/constants/eth-methods';
import { mockNetworkState } from '../../../test/stub/networks';
import { CHAIN_IDS } from '../../../shared/constants/network';
import ConfirmAddSuggestedToken from '.';

const PENDING_APPROVALS = {
  1: {
    id: '1',
    origin: 'https://test-dapp.com',
    time: Date.now(),
    type: ApprovalType.WatchAsset,
    requestData: {
      asset: {
        address: '0x8b175474e89094c44da98b954eedeac495271d0a',
        symbol: 'NEW',
        decimals: 18,
        image: 'metamark.svg',
        unlisted: false,
      },
    },
    requestState: null,
  },
  2: {
    id: '2',
    origin: 'https://test-dapp.com',
    time: Date.now(),
    type: ApprovalType.WatchAsset,
    requestData: {
      asset: {
        address: '0xC8c77482e45F1F44dE1745F52C74426C631bDD51',
        symbol: '0XYX',
        decimals: 18,
        image: '0x.svg',
        unlisted: false,
      },
    },
    requestState: null,
  },
};

const MOCK_TOKEN = {
  address: '0x108cf70c7d384c552f42c07c41c0e1e46d77ea0d',
  symbol: 'TEST',
  decimals: '0',
};

jest.mock('../../store/actions', () => ({
  resolvePendingApproval: jest.fn().mockReturnValue({ type: 'test' }),
  rejectPendingApproval: jest.fn().mockReturnValue({ type: 'test' }),
}));

jest.mock('../../hooks/useIsOriginalTokenSymbol', () => {
  return {
    useIsOriginalTokenSymbol: jest.fn(),
  };
});

const renderComponent = (tokens = []) => {
  const store = configureStore({
    metamask: {
      pendingApprovals: PENDING_APPROVALS,
      tokens,
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),

      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              name: 'Test Account',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
          },
        },
        selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      },
    },
    history: {
      mostRecentOverviewPage: '/',
    },
  });
  return renderWithProvider(<ConfirmAddSuggestedToken />, store);
};

describe('ConfirmAddSuggestedToken Component', () => {
  it('should render', () => {
    renderComponent();

    expect(screen.getByText('Add suggested tokens')).toBeInTheDocument();
    expect(
      screen.getByText('Would you like to import these tokens?'),
    ).toBeInTheDocument();
    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add token' }),
    ).toBeInTheDocument();
  });

  it('should render the list of suggested tokens', () => {
    renderComponent();

    for (const {
      requestData: { asset },
    } of Object.values(PENDING_APPROVALS)) {
      expect(screen.getByText(asset.symbol)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('img')).toHaveLength(
      Object.values(PENDING_APPROVALS).length,
    );
  });

  it('should dispatch resolvePendingApproval when clicking the "Add token" button', async () => {
    renderComponent();
    const addTokenBtn = screen.getByRole('button', { name: 'Add token' });

    await act(async () => {
      fireEvent.click(addTokenBtn);
    });

    expect(resolvePendingApproval).toHaveBeenCalledTimes(
      Object.values(PENDING_APPROVALS).length,
    );

    Object.values(PENDING_APPROVALS).forEach(({ id }) => {
      expect(resolvePendingApproval).toHaveBeenCalledWith(id, null);
    });
  });

  it('should dispatch rejectPendingApproval when clicking the "Cancel" button', async () => {
    renderComponent();
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });

    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    expect(rejectPendingApproval).toHaveBeenCalledTimes(
      Object.values(PENDING_APPROVALS).length,
    );

    Object.values(PENDING_APPROVALS).forEach(({ id }) => {
      expect(rejectPendingApproval).toHaveBeenCalledWith(
        id,
        expect.objectContaining({
          code: 4001,
          message: 'User rejected the request.',
          stack: expect.any(String),
        }),
      );
    });
  });

  describe('when the suggested token address matches an existing token address', () => {
    it('should show "already listed" warning', () => {
      const mockTokens = [
        {
          ...MOCK_TOKEN,
          address:
            Object.values(PENDING_APPROVALS)[0].requestData.asset.address,
        },
      ];
      renderComponent(mockTokens);

      expect(
        screen.getByText(
          'This action will edit tokens that are already listed in your wallet, which can be used' +
            ' to phish you. Only approve if you are certain that you mean to change what these' +
            ' tokens represent. Learn more about',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'scams and security risks.' }),
      ).toBeInTheDocument();
    });
  });

  describe('when the suggested token symbol matches an existing token symbol and has a different address', () => {
    it('should show "reuses a symbol" warning', () => {
      const mockTokens = [
        {
          ...MOCK_TOKEN,
          symbol: Object.values(PENDING_APPROVALS)[0].requestData.asset.symbol,
        },
      ];
      renderComponent(mockTokens);

      expect(
        screen.getByText(
          'A token here reuses a symbol from another token you watch, this can be confusing or deceptive.',
        ),
      ).toBeInTheDocument();
    });
  });
});
