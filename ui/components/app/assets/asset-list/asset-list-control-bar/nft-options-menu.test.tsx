import React from 'react';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import * as actions from '../../../../../store/actions';
import { setBackgroundConnection } from '../../../../../store/background-connection';
import {
  ASSETS_ROUTE,
  IMPORT_NFTS_ROUTE,
  TOKEN_MANAGEMENT_ROUTE,
} from '../../../../../helpers/constants/routes';
import { AssetControls } from './asset-controls';
import { NftOptionsMenu } from './nft-options-menu';
import {
  createMockState,
  selectChain,
  selectSolanaAccount,
} from './control-bar-test-utils';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

const backgroundConnectionMock = new Proxy(
  {},
  {
    get: () => jest.fn().mockResolvedValue(undefined),
  },
);

const renderMenu = (state: ReturnType<typeof createMockState>) => {
  const store = configureMockStore([thunk])(state);
  return renderWithProvider(
    <AssetControls>
      <NftOptionsMenu />
    </AssetControls>,
    store,
  );
};

describe('NftOptionsMenu', () => {
  beforeEach(() => {
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('detects NFTs and checks ownership on mainnet', async () => {
    const detectNftsSpy = jest.spyOn(actions, 'detectNfts');
    const checkOwnershipSpy = jest.spyOn(
      actions,
      'checkAndUpdateAllNftsOwnershipStatus',
    );
    const state = createMockState();

    const { findByTestId } = renderMenu(state);

    fireEvent.click(await findByTestId('asset-list-control-bar-action-button'));
    fireEvent.click(await findByTestId('refresh-list-button__button'));

    expect(detectNftsSpy).toHaveBeenCalled();
    expect(checkOwnershipSpy).toHaveBeenCalled();
  });

  it('detects NFTs and checks ownership on Linea', async () => {
    const detectNftsSpy = jest.spyOn(actions, 'detectNfts');
    const checkOwnershipSpy = jest.spyOn(
      actions,
      'checkAndUpdateAllNftsOwnershipStatus',
    );
    const state = createMockState();
    selectChain(state, CHAIN_IDS.LINEA_MAINNET, 'lineaNetworkClientId');

    const { findByTestId } = renderMenu(state);

    fireEvent.click(await findByTestId('asset-list-control-bar-action-button'));
    fireEvent.click(await findByTestId('refresh-list-button__button'));

    expect(detectNftsSpy).toHaveBeenCalled();
    expect(checkOwnershipSpy).toHaveBeenCalledWith('lineaNetworkClientId');
  });

  it('checks NFT ownership without detecting NFTs on another chain', async () => {
    const detectNftsSpy = jest.spyOn(actions, 'detectNfts');
    const checkOwnershipSpy = jest.spyOn(
      actions,
      'checkAndUpdateAllNftsOwnershipStatus',
    );
    const state = createMockState();
    selectChain(state, CHAIN_IDS.POLYGON, 'polygonNetworkClientId');
    state.metamask.enabledNetworkMap = {
      eip155: {
        [CHAIN_IDS.POLYGON]: true,
      },
    };

    const { findByTestId } = renderMenu(state);

    fireEvent.click(await findByTestId('asset-list-control-bar-action-button'));
    fireEvent.click(await findByTestId('refresh-list-button__button'));

    expect(detectNftsSpy).not.toHaveBeenCalled();
    expect(checkOwnershipSpy).toHaveBeenCalledWith('polygonNetworkClientId');
  });

  it('opens the NFT import page', async () => {
    const state = createMockState();
    const { findByTestId, queryByTestId } = renderMenu(state);

    fireEvent.click(await findByTestId('asset-list-control-bar-action-button'));
    fireEvent.click(await findByTestId('import-nfts__button'));

    expect(mockUseNavigate).toHaveBeenCalledWith(IMPORT_NFTS_ROUTE);
    expect(queryByTestId('import-nfts__button')).not.toBeInTheDocument();
  });

  it('opens autodetect settings when NFT detection is off', async () => {
    const state = createMockState();
    state.metamask.useNftDetection = false;

    const { findByTestId } = renderMenu(state);

    fireEvent.click(await findByTestId('asset-list-control-bar-action-button'));
    fireEvent.click(await findByTestId('enable-autodetect-button__button'));

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${ASSETS_ROUTE}#autodetect-tokens`,
    );
  });

  it('opens token management for a non-EVM account', async () => {
    const state = createMockState();
    selectSolanaAccount(state);

    const { findByTestId, queryByTestId } = renderMenu(state);

    fireEvent.click(await findByTestId('importTokens-button'));

    expect(queryByTestId('refreshList__button')).not.toBeInTheDocument();
    expect(queryByTestId('import-nfts')).not.toBeInTheDocument();
    expect(mockUseNavigate).toHaveBeenCalledWith(TOKEN_MANAGEMENT_ROUTE, {
      state: {
        globalMenuTransition: 'forward',
      },
    });
  });
});
