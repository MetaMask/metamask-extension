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

describe('StellarClassicTrustlineActivateCard', () => {
  const mockStore = configureMockStore([thunk])(initializedMockState);

  beforeEach(() => {
    jest
      .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptAdd')
      .mockResolvedValue(undefined);
    jest
      .spyOn(storeActions, 'forceUpdateMetamaskState')
      .mockResolvedValue(undefined as never);
    jest
      .spyOn(storeActions, 'showAlert')
      .mockReturnValue({ type: 'MOCK_ALERT' } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders nothing when not visible', () => {
    renderWithProvider(
      <StellarClassicTrustlineActivateCard
        visible={false}
        account={MOCK_ACCOUNT_STELLAR_PUBNET}
        chainId={XlmScope.Pubnet}
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
        account={MOCK_ACCOUNT_STELLAR_PUBNET}
        chainId={XlmScope.Pubnet}
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
  });
});
