import * as bridgeControllerUtils from '@metamask/bridge-controller';
import type { QuoteResponse } from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';

import mockBridgeQuotesErc20Erc20 from '../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import { setBackgroundConnection } from '../../store/background-connection';
import { usePrefillFromBridgeState } from './usePrefillFromBridgeState';

const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useLocation: () => mockUseLocation(),
  };
});

const renderUseBridgeQueryParams = (mockStoreState: object) =>
  renderHookWithProvider(() => {
    usePrefillFromBridgeState();
  }, mockStoreState);

describe('usePrefillFromBridgeState', () => {
  const { ChainId } = bridgeControllerUtils;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set params from navigation state', async () => {
    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chainRanking: [
            {
              chainId: bridgeControllerUtils.formatChainIdToCaip(ChainId.LINEA),
            },
          ],
        },
      },
      metamaskStateOverrides: {
        ...mockNetworkState({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      },
    });

    mockUseLocation.mockReturnValue({
      pathname: '/',
      search: '',
      state: {
        token: {
          symbol: 'USDC',
          name: 'USDC',
          decimals: 6,
          chainId: CHAIN_IDS.LINEA_MAINNET,
          assetId:
            'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D',
        },
      },
    });

    const { store } = renderUseBridgeQueryParams(mockStoreState);

    expect(store).toBeDefined();
    const {
      fromToken,
      toToken,
      fromTokenInputValue,
      fromTokenBalance,
      fromNativeBalance,
    } = store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      fromTokenInputValue,
      fromTokenBalance,
      fromNativeBalance,
    }).toMatchInlineSnapshot(`
      {
        "fromNativeBalance": null,
        "fromToken": {
          "accountType": undefined,
          "assetId": "eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D",
          "balance": "0",
          "chainId": "eip155:59144",
          "decimals": 6,
          "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/erc20/0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d.png",
          "name": "USDC",
          "rwaData": undefined,
          "symbol": "USDC",
          "tokenFiatAmount": undefined,
        },
        "fromTokenBalance": null,
        "fromTokenInputValue": null,
        "toToken": undefined,
      }
    `);
  });

  it('should restore inputs from quote', async () => {
    const mockStoreState = createBridgeMockStore({
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[],
      },
      featureFlagOverrides: {
        bridgeConfig: {
          chainRanking: [
            {
              chainId: bridgeControllerUtils.formatChainIdToCaip(
                ChainId.OPTIMISM,
              ),
            },
          ],
        },
      },
      metamaskStateOverrides: {
        ...mockNetworkState({ chainId: CHAIN_IDS.OPTIMISM }),
      },
    });

    mockUseLocation.mockReturnValue({
      pathname: '/',
      search: '',
      state: {
        token: null,
      },
    });

    const { store } = renderUseBridgeQueryParams(mockStoreState);

    expect(store).toBeDefined();
    const { fromToken, toToken, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      fromTokenInputValue,
    }).toMatchInlineSnapshot(`
      {
        "fromToken": {
          "accountType": undefined,
          "assetId": "eip155:10/erc20:0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
          "balance": "0",
          "chainId": "eip155:10",
          "decimals": 6,
          "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/10/erc20/0x0b2c639c533813f4aa9d7837caf62653d097ff85.png",
          "name": "USD Coin",
          "rwaData": undefined,
          "symbol": "USDC",
          "tokenFiatAmount": undefined,
        },
        "fromTokenInputValue": undefined,
        "toToken": {
          "accountType": undefined,
          "assetId": "eip155:137/erc20:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
          "balance": "0",
          "chainId": "eip155:137",
          "decimals": 6,
          "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/137/erc20/0x3c499c542cef5e3811e1192ce70d8cc03d5c3359.png",
          "name": "Native USD Coin (POS)",
          "rwaData": undefined,
          "symbol": "USDC",
          "tokenFiatAmount": undefined,
        },
      }
    `);
  });

  it('should reset controller when there is no quote or navigation state', async () => {
    const resetState = jest.fn();
    setBackgroundConnection({
      resetState,
      getStatePatches: jest.fn(),
    } as never);

    const mockStoreState = createBridgeMockStore({
      bridgeStateOverrides: {
        quoteRequest: {
          srcTokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          destTokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          srcChainId: 10,
          destChainId: 137,
          walletAddress: '0x123',
          slippage: 0.5,
        },
      },
      featureFlagOverrides: {
        bridgeConfig: {
          chainRanking: [
            {
              chainId: bridgeControllerUtils.formatChainIdToCaip(
                ChainId.OPTIMISM,
              ),
            },
          ],
        },
      },
      metamaskStateOverrides: {
        ...mockNetworkState({ chainId: CHAIN_IDS.OPTIMISM }),
      },
    });

    mockUseLocation.mockReturnValue({
      pathname: '/',
      search: '',
      state: {
        token: null,
      },
    });

    renderUseBridgeQueryParams(mockStoreState);
    expect(resetState).toHaveBeenCalledTimes(1);
  });
});
