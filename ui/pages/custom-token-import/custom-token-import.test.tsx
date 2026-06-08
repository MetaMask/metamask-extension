import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  en as messages,
  renderWithProvider,
} from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import {
  CUSTOM_TOKEN_IMPORT_ROUTE,
  TOKEN_MANAGEMENT_ROUTE,
} from '../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { AssetType } from '../../../shared/constants/transaction';
import {
  CustomTokenImportPage,
  mergeCustomTokenMetadataForImport,
} from './custom-token-import';

const METRICS_PROPERTIES = {
  addedToken: 'added_token',
  assetType: 'asset_type',
  chainId: 'chain_id',
  clickedSecurityLink: 'clicked_security_link',
  tokenContractAddress: 'token_contract_address',
  tokenStandard: 'token_standard',
  tokenSymbol: 'token_symbol',
  viewState: 'view_state',
} as const;

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock('../../../shared/lib/assets-unify-state/remote-feature-flag', () =>
  jest.requireActual(
    '../../../shared/lib/assets-unify-state/remote-feature-flag',
  ),
);

// The page kicks off real on-chain probes through `getTokenStandardAndDetailsByChain`
// and `tokenInfoGetter`. Replace them with deterministic stubs so the unit
// test never reaches the background script.
jest.mock('../../store/actions', () => {
  const actual = jest.requireActual('../../store/actions');
  return {
    ...actual,
    addImportedTokens: jest.fn(() => () => Promise.resolve()),
    importCustomAssetsBatch: jest.fn(() => () => Promise.resolve()),
    getTokenStandardAndDetailsByChain: jest.fn().mockResolvedValue({
      standard: 'ERC20',
      symbol: 'APE',
      decimals: '18',
    }),
  };
});

jest.mock('../../helpers/utils/token-util', () => {
  const actual = jest.requireActual('../../helpers/utils/token-util');
  const mockTokenListLookup = jest.fn(async () => ({
    symbol: 'APE',
    decimals: 18,
    name: 'ApeCoin',
  }));
  return {
    ...actual,
    tokenInfoGetter: () => mockTokenListLookup,
    mockTokenListLookup,
  };
});

type TokenUtilModuleWithMock =
  typeof import('../../helpers/utils/token-util') & {
    mockTokenListLookup: jest.Mock;
  };

const getMockedTokenUtil = () =>
  jest.requireMock('../../helpers/utils/token-util') as TokenUtilModuleWithMock;

const getMockedActions = () =>
  jest.requireMock('../../store/actions') as {
    addImportedTokens: jest.Mock;
    importCustomAssetsBatch: jest.Mock;
  };

const ASSETS_UNIFY_STATE_FLAG_ON = {
  assetsUnifyState: {
    enabled: true,
    featureVersion: '1',
  },
};

describe('mergeCustomTokenMetadataForImport', () => {
  it('prefers RPC when the token list returns empty strings and placeholder decimals', () => {
    expect(
      mergeCustomTokenMetadataForImport(
        { symbol: 'OSO', decimals: '18', name: '' },
        { symbol: '', decimals: '0', name: '' },
      ),
    ).toStrictEqual({
      symbol: 'OSO',
      name: '',
      decimals: '18',
    });
  });

  it('falls back to the token list when RPC omits a field', () => {
    expect(
      mergeCustomTokenMetadataForImport(
        { symbol: 'OSO', decimals: '18' },
        { symbol: 'LIST', decimals: 6, name: 'Listed Name' },
      ),
    ).toStrictEqual({
      symbol: 'OSO',
      name: 'Listed Name',
      decimals: '18',
    });
  });

  it('uses the token list when RPC has no metadata', () => {
    expect(
      mergeCustomTokenMetadataForImport(undefined, {
        symbol: 'DAI',
        decimals: '18',
        name: 'Dai Stablecoin',
      }),
    ).toStrictEqual({
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: '18',
    });
  });

  it('trims whitespace from both sources', () => {
    expect(
      mergeCustomTokenMetadataForImport(
        { symbol: '  OSO  ', decimals: '  18  ' },
        { symbol: '  ', decimals: '0' },
      ),
    ).toStrictEqual({
      symbol: 'OSO',
      name: '',
      decimals: '18',
    });
  });
});

describe('CustomTokenImportPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    const actions = getMockedActions();
    actions.addImportedTokens.mockClear();
    actions.importCustomAssetsBatch.mockClear();
    const tokenUtil = getMockedTokenUtil();
    tokenUtil.mockTokenListLookup.mockReset();
    tokenUtil.mockTokenListLookup.mockResolvedValue({
      symbol: 'APE',
      decimals: 18,
      name: 'ApeCoin',
    });
  });

  const buildState = (metamaskOverrides: Record<string, unknown> = {}) => ({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      selectedNetworkClientId: 'mainnet',
      selectedMultichainNetworkChainId: 'eip155:1',
      networkConfigurationsByChainId: {
        ...mockState.metamask.networkConfigurationsByChainId,
        '0x1': {
          chainId: '0x1',
          name: 'Ethereum Mainnet',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'mainnet',
              type: 'infura',
              url: 'https://mainnet.infura.io/v3/',
            },
          ],
        },
      },
      ...metamaskOverrides,
    },
  });

  const renderPage = (
    trackEvent = jest.fn(),
    metamaskOverrides: Record<string, unknown> = {},
  ) => {
    const store = configureStore(buildState(metamaskOverrides));
    return {
      store,
      ...renderWithProvider(
        <CustomTokenImportPage />,
        store,
        CUSTOM_TOKEN_IMPORT_ROUTE,
        undefined,
        () => trackEvent,
      ),
    };
  };

  const submitCustomToken = async (
    metamaskOverrides: Record<string, unknown> = {},
  ) => {
    const trackEvent = jest.fn();
    const rendered = renderPage(trackEvent, metamaskOverrides);

    fireEvent.change(screen.getByTestId('custom-token-import-address-input'), {
      target: { value: '0x1111111111111111111111111111111111111111' },
    });

    await screen.findByTestId('custom-token-import-symbol-input');
    await waitFor(() =>
      expect(
        screen.getByTestId('custom-token-import-submit-button'),
      ).not.toBeDisabled(),
    );

    fireEvent.click(screen.getByTestId('custom-token-import-submit-button'));

    return { trackEvent, ...rendered };
  };

  it('renders the form scaffolding without crashing', () => {
    renderPage();

    expect(screen.getByTestId('custom-token-import-page')).toBeInTheDocument();
    expect(
      screen.getByTestId('custom-token-import-address-input'),
    ).toBeInTheDocument();
    // Symbol/decimal fields are gated behind a valid address entry.
    expect(
      screen.queryByTestId('custom-token-import-symbol-input'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('custom-token-import-decimal-input'),
    ).not.toBeInTheDocument();
  });

  it('tracks the custom token import default view state on page open', async () => {
    const trackEvent = jest.fn();
    renderPage(trackEvent);

    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Wallet,
        event: MetaMetricsEventName.ImportCustomTokenViewed,
        properties: {
          [METRICS_PROPERTIES.viewState]: 'default',
        },
      }),
    );
  });

  it('keeps the submit button disabled while the address field is empty', () => {
    renderPage();

    const submit = screen.getByTestId('custom-token-import-submit-button');
    expect(submit).toBeDisabled();
  });

  it('flags an invalid contract address', () => {
    renderPage();

    const input = screen.getByTestId(
      'custom-token-import-address-input',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '0xnot-an-address' } });

    expect(
      screen.getByText(messages.invalidAddress.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('custom-token-import-submit-button'),
    ).toBeDisabled();
  });

  it('fills symbol and decimals from RPC when the token list returns only empty placeholders', async () => {
    getMockedTokenUtil().mockTokenListLookup.mockResolvedValue({
      symbol: '',
      decimals: '0',
      name: '',
    });
    renderPage();

    fireEvent.change(screen.getByTestId('custom-token-import-address-input'), {
      target: { value: '0x1111111111111111111111111111111111111111' },
    });

    const symbolInput = await screen.findByTestId(
      'custom-token-import-symbol-input',
    );
    await waitFor(() => {
      expect(symbolInput).toHaveValue('APE');
    });
    expect(screen.getByTestId('custom-token-import-decimal-input')).toHaveValue(
      18,
    );
  });

  it('opens the custom import network selector when the network picker is clicked', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('network-selector'));

    expect(
      screen.getByText(messages.networkMenuHeading.message),
    ).toBeInTheDocument();

    const networkItems = screen.getAllByTestId(/select-network-item-/u);
    expect(networkItems.length).toBeGreaterThan(0);
  });

  it('returns to token management with success toast state after submitting a custom token', async () => {
    const actions = getMockedActions();
    const { trackEvent } = await submitCustomToken();

    await waitFor(() =>
      expect(actions.addImportedTokens).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            address: '0x1111111111111111111111111111111111111111',
            symbol: 'APE',
            decimals: 18,
            isERC721: false,
          }),
        ],
        'mainnet',
      ),
    );
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(TOKEN_MANAGEMENT_ROUTE, {
        state: {
          tokenManagementToast: {
            type: 'customTokenAdded',
            symbol: 'APE',
          },
        },
      }),
    );
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Wallet,
        event: MetaMetricsEventName.ImportCustomTokenInteracted,
        sensitiveProperties: {
          [METRICS_PROPERTIES.addedToken]: 1,
          [METRICS_PROPERTIES.assetType]: AssetType.token,
          [METRICS_PROPERTIES.chainId]: '0x1',
          [METRICS_PROPERTIES.clickedSecurityLink]: false,
          [METRICS_PROPERTIES.tokenContractAddress]:
            '0x1111111111111111111111111111111111111111',
          [METRICS_PROPERTIES.tokenStandard]: 'ERC20',
          [METRICS_PROPERTIES.tokenSymbol]: 'APE',
        },
      }),
    );
  });

  describe('when the assets-unify-state remote feature flag is enabled', () => {
    it('seeds AssetsController via importCustomAssetsBatch so the token appears in the manage-tokens list', async () => {
      const actions = getMockedActions();

      await submitCustomToken({
        remoteFeatureFlags: ASSETS_UNIFY_STATE_FLAG_ON,
      });

      const expectedAssetId =
        'eip155:1/erc20:0x1111111111111111111111111111111111111111';

      await waitFor(() =>
        expect(actions.importCustomAssetsBatch).toHaveBeenCalledWith(
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          [
            {
              assetId: expectedAssetId,
              isHidden: false,
            },
          ],
          {
            [expectedAssetId]: expect.objectContaining({
              address: '0x1111111111111111111111111111111111111111',
              symbol: 'APE',
              name: 'ApeCoin',
              decimals: 18,
              chainId: '0x1',
              unlisted: true,
            }),
          },
        ),
      );

      await waitFor(() => expect(actions.addImportedTokens).toHaveBeenCalled());
    });

    it('passes the full token name (not the symbol) as the name field in metadata', async () => {
      const actions = getMockedActions();

      await submitCustomToken({
        remoteFeatureFlags: ASSETS_UNIFY_STATE_FLAG_ON,
      });

      const expectedAssetId =
        'eip155:1/erc20:0x1111111111111111111111111111111111111111';

      await waitFor(() => {
        const metadataArg = actions.importCustomAssetsBatch.mock.calls[0][2];
        const metadata = metadataArg[expectedAssetId];
        // tokenInfoGetter mock returns name: 'ApeCoin' and symbol: 'APE'.
        // These must be stored separately; the symbol must not be used in place
        // of the name.
        expect(metadata.name).toBe('ApeCoin');
        expect(metadata.symbol).toBe('APE');
        expect(metadata.name).not.toBe(metadata.symbol);
      });
    });

    it('marks the asset as previously hidden when assetPreferences has hidden: true for it', async () => {
      const actions = getMockedActions();
      const assetId =
        'eip155:1/erc20:0x1111111111111111111111111111111111111111';

      await submitCustomToken({
        remoteFeatureFlags: ASSETS_UNIFY_STATE_FLAG_ON,
        assetPreferences: {
          [assetId]: { hidden: true },
        },
      });

      await waitFor(() =>
        expect(actions.importCustomAssetsBatch).toHaveBeenCalledWith(
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          [
            {
              assetId,
              isHidden: true,
            },
          ],
          expect.any(Object),
        ),
      );
    });

    it('allows re-importing a token that is currently hidden in assetPreferences without showing "tokenAlreadyAdded"', async () => {
      const actions = getMockedActions();
      const tokenAddress = '0x1111111111111111111111111111111111111111';
      const assetId = `eip155:1/erc20:${tokenAddress}`;
      const accountId = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';

      renderPage(jest.fn(), {
        remoteFeatureFlags: ASSETS_UNIFY_STATE_FLAG_ON,
        // Simulate state after the user hid the token from the manage tokens
        // list when assets-unify-state is on: the token remains in
        // `customAssets` (so the unified `getAllTokens` selector still
        // returns it) and `assetPreferences[assetId].hidden` is `true`.
        customAssets: { [accountId]: [assetId] },
        assetsInfo: {
          [assetId]: {
            type: 'erc20',
            symbol: 'APE',
            name: 'ApeCoin',
            decimals: 18,
          },
        },
        assetPreferences: {
          [assetId]: { hidden: true },
        },
      });

      fireEvent.change(
        screen.getByTestId('custom-token-import-address-input'),
        { target: { value: tokenAddress } },
      );

      await screen.findByTestId('custom-token-import-symbol-input');

      expect(
        screen.queryByText(messages.tokenAlreadyAdded.message),
      ).not.toBeInTheDocument();
      await waitFor(() =>
        expect(
          screen.getByTestId('custom-token-import-submit-button'),
        ).not.toBeDisabled(),
      );

      fireEvent.click(screen.getByTestId('custom-token-import-submit-button'));

      await waitFor(() =>
        expect(actions.importCustomAssetsBatch).toHaveBeenCalledWith(
          accountId,
          [
            {
              assetId,
              isHidden: true,
            },
          ],
          expect.any(Object),
        ),
      );
    });
  });

  it('still shows "tokenAlreadyAdded" for a visible (non-hidden) token even when assets-unify-state is enabled', async () => {
    const tokenAddress = '0x1111111111111111111111111111111111111111';
    const assetId = `eip155:1/erc20:${tokenAddress}`;
    const accountId = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';

    renderPage(jest.fn(), {
      remoteFeatureFlags: ASSETS_UNIFY_STATE_FLAG_ON,
      // Token is present in `customAssets` but NOT hidden: the unified
      // selector should still return it, so the "already added" guard
      // must trigger.
      customAssets: { [accountId]: [assetId] },
      assetsInfo: {
        [assetId]: {
          type: 'erc20',
          symbol: 'APE',
          name: 'ApeCoin',
          decimals: 18,
        },
      },
    });

    fireEvent.change(screen.getByTestId('custom-token-import-address-input'), {
      target: { value: tokenAddress },
    });

    await waitFor(() =>
      expect(
        screen.getByText(messages.tokenAlreadyAdded.message),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByTestId('custom-token-import-submit-button'),
    ).toBeDisabled();
  });
});
