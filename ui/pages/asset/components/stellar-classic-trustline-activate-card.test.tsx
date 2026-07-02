import { AccountGroupType, AccountWalletType } from '@metamask/account-api';
import { XlmScope } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import React from 'react';

import { MOCK_ACCOUNT_STELLAR_PUBNET } from '../../../../test/data/mock-accounts';
import initializedMockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as storeActions from '../../../store/actions';
import * as stellarSnapRequests from '../utils/stellar-snap-client-requests';
import { StellarClassicTrustlineActivateCard } from './stellar-classic-trustline-activate-card';

const PUBNET_USDC_ASSET =
  'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as CaipAssetType;

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

describe('StellarClassicTrustlineActivateCard', () => {
  const mockStore = configureMockStore([thunk])(stellarMockState);

  beforeEach(() => {
    jest
      .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptAdd')
      .mockResolvedValue({ status: true });
    jest
      .spyOn(storeActions, 'forceUpdateMetamaskState')
      .mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders nothing when not visible', () => {
    renderWithProvider(
      <StellarClassicTrustlineActivateCard
        visible={false}
        assetId={PUBNET_USDC_ASSET}
        symbol="USDC"
      />,
      mockStore,
    );

    expect(
      screen.queryByTestId('stellar-classic-trustline-activate-card'),
    ).not.toBeInTheDocument();
  });

  it('submits changeTrustOpt add when the user taps Activate', async () => {
    renderWithProvider(
      <StellarClassicTrustlineActivateCard
        visible
        assetId={PUBNET_USDC_ASSET}
        symbol="USDC"
      />,
      mockStore,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('stellar-classic-trustline-activate-button'),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByTestId('stellar-classic-trustline-activate-button'),
    );

    await waitFor(() => {
      expect(
        stellarSnapRequests.requestStellarChangeTrustOptAdd,
      ).toHaveBeenCalledWith({
        accountId: MOCK_ACCOUNT_STELLAR_PUBNET.id,
        assetId: PUBNET_USDC_ASSET,
        scope: XlmScope.Pubnet,
      });
    });

    expect(storeActions.forceUpdateMetamaskState).toHaveBeenCalled();
    expect(
      screen.queryByTestId('stellar-classic-trustline-add-error-toast'),
    ).not.toBeInTheDocument();
  });

  it('does not refresh state or show error toast when snap returns status false after funding prompt', async () => {
    jest
      .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptAdd')
      .mockResolvedValue({ status: false });

    renderWithProvider(
      <StellarClassicTrustlineActivateCard
        visible
        assetId={PUBNET_USDC_ASSET}
        symbol="USDC"
      />,
      mockStore,
    );

    fireEvent.click(
      screen.getByTestId('stellar-classic-trustline-activate-button'),
    );

    await waitFor(() => {
      expect(
        stellarSnapRequests.requestStellarChangeTrustOptAdd,
      ).toHaveBeenCalled();
    });

    expect(storeActions.forceUpdateMetamaskState).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId('stellar-classic-trustline-add-error-toast'),
    ).not.toBeInTheDocument();
  });

  it('shows a dismissible error toast when changeTrustOpt fails for a reason other than user cancel', async () => {
    jest
      .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptAdd')
      .mockRejectedValue(new Error('network failure'));

    renderWithProvider(
      <StellarClassicTrustlineActivateCard
        visible
        assetId={PUBNET_USDC_ASSET}
        symbol="USDC"
      />,
      mockStore,
    );

    fireEvent.click(
      screen.getByTestId('stellar-classic-trustline-activate-button'),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('stellar-classic-trustline-add-error-toast'),
      ).toBeInTheDocument();
    });

    expect(storeActions.forceUpdateMetamaskState).not.toHaveBeenCalled();
  });
});
