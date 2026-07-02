import { AccountGroupType, AccountWalletType } from '@metamask/account-api';
import { XlmScope } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import React from 'react';

import { AssetType } from '../../../../shared/constants/transaction';
import { MOCK_ACCOUNT_STELLAR_PUBNET } from '../../../../test/data/mock-accounts';
import initializedMockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as storeActions from '../../../store/actions';
import * as stellarSnapRequests from '../utils/stellar-snap-client-requests';
import type { Asset } from '../types/asset';
import TokenButtons from './token-buttons';

const PUBNET_USDC_ASSET =
  'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as CaipAssetType;

const STELLAR_TOKEN = {
  type: AssetType.token,
  address: PUBNET_USDC_ASSET,
  chainId: XlmScope.Pubnet,
  symbol: 'USDC',
  decimals: 7,
  image: '',
} as Asset & { type: typeof AssetType.token };

const STELLAR_WALLET_ID = 'entropy:stellar-test';
const STELLAR_GROUP_ID = 'entropy:stellar-test/0';

const stellarMockState = {
  ...initializedMockState,
  metamask: {
    ...initializedMockState.metamask,
    internalAccounts: {
      ...initializedMockState.metamask.internalAccounts,
      accounts: {
        ...initializedMockState.metamask.internalAccounts.accounts,
        [MOCK_ACCOUNT_STELLAR_PUBNET.id]: MOCK_ACCOUNT_STELLAR_PUBNET,
      },
    },
    accountTree: {
      ...initializedMockState.metamask.accountTree,
      wallets: {
        ...initializedMockState.metamask.accountTree.wallets,
        [STELLAR_WALLET_ID]: {
          id: STELLAR_WALLET_ID,
          type: AccountWalletType.Entropy,
          status: 'ready',
          groups: {
            [STELLAR_GROUP_ID]: {
              id: STELLAR_GROUP_ID,
              type: AccountGroupType.MultichainAccount,
              accounts: [MOCK_ACCOUNT_STELLAR_PUBNET.id],
              metadata: {
                name: 'Stellar',
                entropy: { groupIndex: 0 },
                pinned: false,
                hidden: false,
                lastSelected: 0,
              },
            },
          },
          metadata: {
            name: 'Stellar Wallet',
            entropy: { id: 'stellar-test' },
          },
        },
      },
    },
    selectedAccountGroup: STELLAR_GROUP_ID,
  },
};

describe('TokenButtons', () => {
  const mockStore = configureMockStore([thunk])(stellarMockState);

  beforeEach(() => {
    jest
      .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptDelete')
      .mockResolvedValue(undefined);
    jest
      .spyOn(storeActions, 'forceUpdateMetamaskState')
      .mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('omits remove trustline when the token is not a trustline asset', () => {
    renderWithProvider(
      <TokenButtons
        token={{
          ...STELLAR_TOKEN,
          address:
            'stellar:pubnet/sep41:CBIJBDNZNF4X35BJ4FFZWCDBSCKOP5NB4PLG4SNENRMLAPYG4P5FM6VN' as CaipAssetType,
        }}
        disableSendForNonEvm
      />,
      mockStore,
    );

    expect(
      screen.queryByTestId('token-overview-stellar-remove-trustline'),
    ).not.toBeInTheDocument();
  });

  it('renders remove trustline for a trustline asset', () => {
    renderWithProvider(
      <TokenButtons token={STELLAR_TOKEN} disableSendForNonEvm />,
      mockStore,
    );

    expect(
      screen.getByTestId('token-overview-stellar-remove-trustline'),
    ).toBeInTheDocument();
  });

  it('submits remove trustline when tapped', async () => {
    renderWithProvider(
      <TokenButtons token={STELLAR_TOKEN} disableSendForNonEvm />,
      mockStore,
    );

    fireEvent.click(
      screen.getByTestId('token-overview-stellar-remove-trustline'),
    );

    await waitFor(() => {
      expect(
        stellarSnapRequests.requestStellarChangeTrustOptDelete,
      ).toHaveBeenCalledWith({
        accountId: MOCK_ACCOUNT_STELLAR_PUBNET.id,
        assetId: PUBNET_USDC_ASSET,
        scope: XlmScope.Pubnet,
      });
    });

    expect(storeActions.forceUpdateMetamaskState).toHaveBeenCalled();
    expect(
      screen.queryByTestId('stellar-classic-trustline-remove-error-toast'),
    ).not.toBeInTheDocument();
  });

  it('shows a dismissible error toast when remove trustline fails', async () => {
    jest
      .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptDelete')
      .mockRejectedValue(new Error('network failure'));

    renderWithProvider(
      <TokenButtons token={STELLAR_TOKEN} disableSendForNonEvm />,
      mockStore,
    );

    fireEvent.click(
      screen.getByTestId('token-overview-stellar-remove-trustline'),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('stellar-classic-trustline-remove-error-toast'),
      ).toBeInTheDocument();
    });

    expect(storeActions.forceUpdateMetamaskState).not.toHaveBeenCalled();
  });

  it('shows a non-zero balance error when remove trustline fails with a token balance', async () => {
    jest
      .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptDelete')
      .mockRejectedValue(new Error('balance must be zero'));

    renderWithProvider(
      <TokenButtons
        token={{
          ...STELLAR_TOKEN,
          balance: {
            value: '255000000',
            display: '25.50',
            fiat: '25.50',
          },
        }}
        disableSendForNonEvm
      />,
      mockStore,
    );

    fireEvent.click(
      screen.getByTestId('token-overview-stellar-remove-trustline'),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('stellar-classic-trustline-remove-error-toast'),
      ).toHaveTextContent(
        'You still have 25.50 USDC in this wallet. You must send or swap it all before deactivating this asset on Stellar.',
      );
    });
  });
});
