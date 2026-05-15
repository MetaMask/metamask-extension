import { XlmScope } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import React from 'react';

import { AssetType } from '../../../../shared/constants/transaction';
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

describe('TokenButtons', () => {
  const mockStore = configureMockStore([thunk])(initializedMockState);

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

  it('omits remove trustline when stellarClassicTrustlineRemove is unset', () => {
    renderWithProvider(
      <TokenButtons token={STELLAR_TOKEN} disableSendForNonEvm />,
      mockStore,
    );

    expect(
      screen.queryByTestId('token-overview-stellar-remove-trustline'),
    ).not.toBeInTheDocument();
  });

  it('renders disabled remove trustline when hasTrustline is false', () => {
    renderWithProvider(
      <TokenButtons
        token={STELLAR_TOKEN}
        disableSendForNonEvm
        stellarClassicTrustlineRemove={{
          hasTrustline: false,
          accountId: 'acc-1',
          assetId: PUBNET_USDC_ASSET,
          scope: XlmScope.Pubnet,
        }}
      />,
      mockStore,
    );

    expect(
      screen.getByTestId('token-overview-stellar-remove-trustline'),
    ).toBeDisabled();
  });

  it('submits remove trustline when enabled and tapped', async () => {
    renderWithProvider(
      <TokenButtons
        token={STELLAR_TOKEN}
        disableSendForNonEvm
        stellarClassicTrustlineRemove={{
          hasTrustline: true,
          accountId: 'acc-1',
          assetId: PUBNET_USDC_ASSET,
          scope: XlmScope.Pubnet,
        }}
      />,
      mockStore,
    );

    fireEvent.click(
      screen.getByTestId('token-overview-stellar-remove-trustline'),
    );

    await waitFor(() => {
      expect(
        stellarSnapRequests.requestStellarChangeTrustOptDelete,
      ).toHaveBeenCalledWith({
        accountId: 'acc-1',
        assetId: PUBNET_USDC_ASSET,
        scope: XlmScope.Pubnet,
      });
    });

    expect(storeActions.forceUpdateMetamaskState).toHaveBeenCalled();
  });
});
