import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../../app/_locales/en/messages.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import * as actions from '../../../../../store/actions';
import { setBackgroundConnection } from '../../../../../store/background-connection';
import { TOKEN_MANAGEMENT_ROUTE } from '../../../../../helpers/constants/routes';
import { AssetControls } from './asset-controls';
import { TokenOptionsMenu } from './token-options-menu';
import {
  DEFAULT_ACCOUNT_GROUP_ID,
  SOLANA_CHAIN_ID,
  addSolanaAccountToSelectedGroup,
  createMockState,
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
      <TokenOptionsMenu />
    </AssetControls>,
    store,
  );
};

const openMenu = async (
  findByTestId: (testId: string) => Promise<HTMLElement>,
) => {
  fireEvent.click(await findByTestId('asset-list-control-bar-action-button'));
  // Popper writes its position on the next tick.
  await act(async () => {
    await Promise.resolve();
  });
};

describe('TokenOptionsMenu', () => {
  beforeEach(() => {
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('opens token management', async () => {
    const state = createMockState();
    const { findByTestId } = renderMenu(state);

    await openMenu(findByTestId);
    fireEvent.click(await findByTestId('manageTokens__button'));

    expect(mockUseNavigate).toHaveBeenCalledWith(TOKEN_MANAGEMENT_ROUTE, {
      state: {
        globalMenuTransition: 'forward',
      },
    });
  });

  it('shows manage tokens and refresh list for a non-EVM account', async () => {
    const state = createMockState();
    selectSolanaAccount(state);
    const { findByTestId } = renderMenu(state);

    await openMenu(findByTestId);

    expect(await findByTestId('refreshList__button')).toHaveTextContent(
      messages.refreshList.message,
    );
    expect(await findByTestId('manageTokens__button')).toBeInTheDocument();
  });

  it('refreshes the selected group for one enabled network', async () => {
    const refreshAssetsSpy = jest.spyOn(
      actions,
      'refreshAssetsForSelectedAccount',
    );
    const state = createMockState();
    state.metamask.enabledNetworkMap = {
      eip155: {
        '0x1': true,
      },
    };
    const { findByTestId } = renderMenu(state);

    await openMenu(findByTestId);
    fireEvent.click(await findByTestId('refreshList__button'));

    expect(refreshAssetsSpy).toHaveBeenCalledWith(
      [
        expect.objectContaining({ id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3' }),
        expect.objectContaining({ id: '07c2cfec-36c9-46c4-8115-3836d3ac9047' }),
      ],
      {
        chainIds: ['eip155:1'],
        assetTypes: ['token', 'price', 'metadata'],
      },
    );
  });

  it('refreshes the selected group for every enabled network', async () => {
    const refreshAssetsSpy = jest.spyOn(
      actions,
      'refreshAssetsForSelectedAccount',
    );
    const state = createMockState();
    addSolanaAccountToSelectedGroup(state);
    state.metamask.enabledNetworkMap = {
      eip155: { '0x1': true },
      solana: { [SOLANA_CHAIN_ID]: true },
    };
    const groupAccountIds =
      state.metamask.accountTree.wallets['entropy:01JKAF3DSGM3AB87EM9N0K41AJ']
        .groups[DEFAULT_ACCOUNT_GROUP_ID].accounts;
    const { findByTestId } = renderMenu(state);

    await openMenu(findByTestId);
    fireEvent.click(await findByTestId('refreshList__button'));

    expect(refreshAssetsSpy).toHaveBeenCalledWith(
      groupAccountIds.map((id) => expect.objectContaining({ id })),
      {
        chainIds: ['eip155:1', SOLANA_CHAIN_ID],
        assetTypes: ['token', 'price', 'metadata'],
      },
    );
  });

  it('does not refresh assets when the selected group has no accounts', async () => {
    const refreshAssetsSpy = jest.spyOn(
      actions,
      'refreshAssetsForSelectedAccount',
    );
    const state = createMockState();
    state.metamask.accountTree.wallets[
      'entropy:01JKAF3DSGM3AB87EM9N0K41AJ'
    ].groups[DEFAULT_ACCOUNT_GROUP_ID].accounts = [];
    const { findByTestId, queryByTestId } = renderMenu(state);

    await openMenu(findByTestId);
    fireEvent.click(await findByTestId('refreshList__button'));

    expect(refreshAssetsSpy).not.toHaveBeenCalled();
    expect(queryByTestId('refreshList__button')).not.toBeInTheDocument();
  });
});
