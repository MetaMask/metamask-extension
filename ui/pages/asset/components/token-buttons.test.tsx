import { AccountGroupType, AccountWalletType } from '@metamask/account-api';
import { XlmScope } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import { AssetType } from '../../../../shared/constants/transaction';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { MOCK_ACCOUNT_STELLAR_PUBNET } from '../../../../test/data/mock-accounts';
import initializedMockState from '../../../../test/data/mock-state.json';
import * as storeActions from '../../../store/actions';
import * as stellarSnapRequests from '../utils/stellar-snap-client-requests';
import { Asset } from '../types/asset';
import TokenButtons from './token-buttons';

const mockGoToBuy = jest.fn().mockResolvedValue(true);
jest.mock('../../../hooks/ramps/useRampsNavigation/useRampsNavigation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => ({ goToBuy: mockGoToBuy }),
}));

jest.mock('../../../hooks/bridge/useBridging', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => ({ openBridgeExperience: jest.fn() }),
}));

const mockTrackEvent = jest.fn();
jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({ trackEvent: mockTrackEvent, createEventBuilder }),
  };
});

const token = {
  type: AssetType.token,
  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
  chainId: CHAIN_IDS.MAINNET,
  decimals: 18,
  symbol: 'DAI',
  image: '',
} as Asset & { type: AssetType.token };

const store = configureMockStore()({
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    useExternalServices: true,
  },
});

describe('TokenButtons buy wiring', () => {
  beforeEach(() => jest.clearAllMocks());

  it('routes the Buy button through goToBuy with the token as intent assetId', () => {
    const { getByTestId } = renderWithProvider(
      <TokenButtons token={token} />,
      store,
    );

    fireEvent.click(getByTestId('token-overview-buy'));
    expect(mockGoToBuy).toHaveBeenCalledWith({
      assetId: toAssetId(token.address, token.chainId),
      chainId: token.chainId,
    });
  });

  it('does not track a buy click when the ramps gate blocks the buy', async () => {
    mockGoToBuy.mockResolvedValueOnce(false);
    const { getByTestId } = renderWithProvider(
      <TokenButtons token={token} />,
      store,
    );

    fireEvent.click(getByTestId('token-overview-buy'));
    await waitFor(() => expect(mockGoToBuy).toHaveBeenCalled());
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});

const PUBNET_USDC_ASSET =
  'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as CaipAssetType;

const STELLAR_TOKEN = {
  type: AssetType.token,
  address: PUBNET_USDC_ASSET,
  chainId: XlmScope.Pubnet,
  symbol: 'USDC',
  decimals: 7,
  image: '',
  balance: {
    value: '0',
    display: '0.00',
    fiat: '0.00',
  },
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
    accountAssets: {
      [MOCK_ACCOUNT_STELLAR_PUBNET.id]: {
        [PUBNET_USDC_ASSET]: {
          limit: '10',
          authorized: true,
          sponsored: false,
        },
      },
    },
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
      screen.queryByTestId('token-overview-deactivate-asset'),
    ).not.toBeInTheDocument();
  });

  it('renders remove trustline for a trustline asset', () => {
    renderWithProvider(
      <TokenButtons token={STELLAR_TOKEN} disableSendForNonEvm />,
      mockStore,
    );

    expect(
      screen.getByTestId('token-overview-deactivate-asset'),
    ).toBeInTheDocument();
  });

  it('submits remove trustline when tapped', async () => {
    renderWithProvider(
      <TokenButtons token={STELLAR_TOKEN} disableSendForNonEvm />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('token-overview-deactivate-asset'));

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
      screen.queryByTestId('asset-activation-error-container'),
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

    fireEvent.click(screen.getByTestId('token-overview-deactivate-asset'));

    await waitFor(() => {
      expect(
        screen.getByTestId('asset-activation-error-container'),
      ).toBeInTheDocument();
    });

    expect(storeActions.forceUpdateMetamaskState).not.toHaveBeenCalled();
  });

  it('shows a non-zero balance error when remove trustline fails with a token balance', async () => {
    jest
      .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptDelete')
      .mockRejectedValue(new Error('balance must be zero'));

    const storeWithBalance = configureMockStore([thunk])({
      ...stellarMockState,
      metamask: {
        ...stellarMockState.metamask,
        balances: {
          [MOCK_ACCOUNT_STELLAR_PUBNET.id]: {
            [PUBNET_USDC_ASSET]: {
              amount: '25.50',
              unit: 'USDC',
            },
          },
        },
      },
    });

    renderWithProvider(
      <TokenButtons token={STELLAR_TOKEN} disableSendForNonEvm />,
      storeWithBalance,
    );

    fireEvent.click(screen.getByTestId('token-overview-deactivate-asset'));

    await waitFor(() => {
      expect(
        screen.getByTestId('asset-activation-error-container'),
      ).toHaveTextContent(
        'You still have 25.50 USDC in this wallet. You must send or swap it all before deactivating this asset on Stellar.',
      );
    });
  });
});
