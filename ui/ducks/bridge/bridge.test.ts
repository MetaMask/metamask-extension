import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { zeroAddress } from 'ethereumjs-util';
import {
  BridgeBackgroundAction,
  BridgeUserAction,
  RequestStatus,
} from '@metamask/bridge-controller';
import { CHAIN_IDS, FEATURED_RPCS } from '../../../shared/constants/network';
import * as networkConstants from '../../../shared/constants/network';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { setBackgroundConnection } from '../../store/background-connection';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { SlippageValue } from '../../pages/bridge/utils/slippage-service';
import * as cacheUtils from '../../pages/bridge/utils/cache';
import * as storeActions from '../../store/actions';
import * as sentry from '../../../shared/lib/sentry';
import bridgeReducer, { initialState } from './bridge';
import { BridgeMissingNetworkConfigError } from './errors';
import {
  setFromToken,
  setFromTokenInputValue,
  setToToken,
  updateQuoteRequestParams,
  setWasTxDeclined,
  setSlippage,
  resetBridgeController,
  resetInputFields,
} from './actions';

const middleware = [thunk];

describe('Ducks - Bridge', () => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store = configureMockStore<any>(middleware)(createBridgeMockStore());

  beforeEach(() => {
    store.clearActions();
  });

  describe('setSlippage', () => {
    it('calls the "bridge/setSlippage" action', () => {
      const state = store.getState().bridge;
      const actionPayload = 0.1;

      store.dispatch(setSlippage(actionPayload as never) as never);

      // Check redux state
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/setSlippage');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.slippage).toStrictEqual(actionPayload);
    });
  });

  describe('setFromToken', () => {
    beforeEach(() => {
      setBackgroundConnection({
        setActiveNetwork: jest.fn(),
        setEnabledAllPopularNetworks: jest.fn(),
        getStatePatches: jest.fn(),
      } as never);
    });

    it('dispatches the action for a supported non-EVM chain (Solana)', () => {
      const state = store.getState().bridge;
      const actionPayload = {
        symbol: 'SYMBOL',
        chainId: MultichainNetworks.SOLANA,
        assetId:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:So11111111111111111111111111111111111111112',
        decimals: 9,
      };
      store.dispatch(setFromToken(actionPayload as never) as never);
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/setFromToken');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.fromToken).toMatchInlineSnapshot(`
        {
          "accountType": undefined,
          "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:So11111111111111111111111111111111111111112",
          "balance": "0",
          "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
          "decimals": 9,
          "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/So11111111111111111111111111111111111111112.png",
          "isVerified": undefined,
          "name": "SYMBOL",
          "rwaData": undefined,
          "securityData": undefined,
          "symbol": "SYMBOL",
          "tokenFiatAmount": undefined,
        }
      `);
    });

    it('dispatches the action for a supported EVM chain that is in the user network configs', () => {
      // The default mock store includes Mainnet — this should succeed.
      const actionPayload = {
        symbol: 'ETH',
        chainId: 'eip155:1',
        assetId: 'eip155:1/slip44:60',
        decimals: 18,
        name: 'Ethereum',
      };
      store.dispatch(setFromToken(actionPayload as never) as never);
      const actions = store.getActions();
      expect(actions.some((a) => a.type === 'bridge/setFromToken')).toBe(true);
    });

    it('does not dispatch the action for an unsupported chain', () => {
      // eip155:99999 is not in ALL_ALLOWED_BRIDGE_CHAIN_IDS
      const actionPayload = {
        symbol: 'UNKNOWN',
        chainId: 'eip155:99999',
        assetId: 'eip155:99999/slip44:60',
        decimals: 18,
        name: 'Unknown',
      };
      store.dispatch(setFromToken(actionPayload as never) as never);
      const actions = store.getActions();
      expect(actions.some((a) => a.type === 'bridge/setFromToken')).toBe(false);
    });

    it('dispatches addNetwork then sets fromToken for a supported EVM chain not yet in user configs', async () => {
      // Arbitrum is a supported bridge chain but the default mock store only has
      // Mainnet, Linea, and Optimism. setFromToken should auto-enable it via
      // addNetwork and then fall through to dispatch bridge/setFromToken in the
      // same thunk invocation — no external retry needed.
      const arbitrum = FEATURED_RPCS.find(
        (rpc) => rpc.chainId === CHAIN_IDS.ARBITRUM,
      );
      expect(arbitrum).toBeDefined();

      const addNetworkSpy = jest
        .spyOn(storeActions, 'addNetwork')
        .mockReturnValue((() => Promise.resolve(undefined)) as never);

      const actionPayload = {
        symbol: 'ETH',
        chainId: 'eip155:42161',
        assetId: 'eip155:42161/slip44:60',
        decimals: 18,
        name: 'Ethereum',
      };
      await store.dispatch(setFromToken(actionPayload as never) as never);
      const actions = store.getActions();

      expect(addNetworkSpy).toHaveBeenCalledTimes(1);
      expect(addNetworkSpy).toHaveBeenCalledWith(arbitrum);
      expect(actions.some((a) => a.type === 'bridge/setFromToken')).toBe(true);
    });

    it('captures a Sentry exception when chain is supported but absent from both user configs and FEATURED_RPCS', () => {
      const captureExceptionSpy = jest
        .spyOn(sentry, 'captureException')
        .mockImplementation(jest.fn());

      const featuredRpcsHandle = jest.replaceProperty(
        networkConstants,
        'FEATURED_RPCS',
        [] as never,
      );

      try {
        const actionPayload = {
          symbol: 'ETH',
          chainId: 'eip155:42161',
          assetId: 'eip155:42161/slip44:60',
          decimals: 18,
          name: 'Ethereum',
        };
        store.dispatch(setFromToken(actionPayload as never) as never);
        const actions = store.getActions();

        expect(actions.some((a) => a.type === 'bridge/setFromToken')).toBe(
          false,
        );
        expect(captureExceptionSpy).toHaveBeenCalledTimes(1);
        expect(captureExceptionSpy.mock.calls[0][0]).toBeInstanceOf(
          BridgeMissingNetworkConfigError,
        );
      } finally {
        featuredRpcsHandle.restore();
      }
    });
  });

  describe('setToToken', () => {
    it('calls the "bridge/setToToken" action', () => {
      const state = store.getState().bridge;
      const actionPayload = {
        symbol: 'SYMBOL',
        address: '0x13341431',
        chainId: CHAIN_IDS.LINEA_MAINNET,
        assetId: 'eip155:10/erc20:0x13341431',
        name: 'SYMBOL',
        decimals: 18,
      };

      store.dispatch(setToToken(actionPayload as never) as never);
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/setToToken');
      const newState = bridgeReducer(state, actions[0]);
      const { address, ...expected } = actionPayload;
      expect(newState.toToken).toStrictEqual({
        ...expected,
        accountType: undefined,
        tokenFiatAmount: undefined,
        balance: '0',
        chainId: 'eip155:10',
        rwaData: undefined,
        isVerified: undefined,
        securityData: undefined,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/10/erc20/0x13341431.png',
      });
    });
  });

  describe('setFromTokenInputValue', () => {
    it('calls the "bridge/setFromTokenInputValue" action', () => {
      const state = store.getState().bridge;
      const actionPayload = '10';

      store.dispatch(setFromTokenInputValue(actionPayload as never) as never);
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/setFromTokenInputValue');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.fromTokenInputValue).toStrictEqual(actionPayload);
    });
  });

  describe('resetInputFields', () => {
    it('resets to initalState', async () => {
      const state = store.getState().bridge;
      store.dispatch(resetInputFields() as never);
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/resetInputFields');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState).toStrictEqual(initialState);
    });
  });

  describe('updateQuoteRequestParams', () => {
    it('dispatches quote params to the bridge controller', () => {
      const mockUpdateParams = jest.fn();
      setBackgroundConnection({
        [BridgeUserAction.UPDATE_QUOTE_PARAMS]: mockUpdateParams,
        getStatePatches: jest.fn(),
      } as never);

      store.dispatch(
        updateQuoteRequestParams(
          {
            walletAddress: '0x1234567890',
            srcChainId: 1,
            srcTokenAddress: zeroAddress(),
            destTokenAddress: undefined,
          },
          {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            stx_enabled: false,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            token_symbol_source: 'ETH',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            token_symbol_destination: 'ETH',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            security_warnings: [],
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            usd_amount_source: 1000,
          },
        ) as never,
      );

      expect(mockUpdateParams).toHaveBeenCalledTimes(1);
      expect(mockUpdateParams).toHaveBeenCalledWith(
        {
          walletAddress: '0x1234567890',
          srcChainId: 1,
          srcTokenAddress: zeroAddress(),
          destTokenAddress: undefined,
        },
        {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          stx_enabled: false,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_source: 'ETH',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_destination: 'ETH',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          security_warnings: [],
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          usd_amount_source: 1000,
        },
      );
    });
  });

  describe('resetBridgeController', () => {
    it('dispatches action to the bridge controller', async () => {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockStore = configureMockStore<any>(middleware)(
        createBridgeMockStore({
          bridgeSliceOverrides: { fromTokenInputValue: '10' },
        }),
      );
      const mockResetBridgeState = jest.fn();
      const mockClearAllBridgeCacheItems = jest.spyOn(
        cacheUtils,
        'clearAllBridgeCacheItems',
      );
      setBackgroundConnection({
        [BridgeBackgroundAction.RESET_STATE]: mockResetBridgeState,
        getStatePatches: jest.fn(),
      } as never);

      await mockStore.dispatch((await resetBridgeController()) as never);

      expect(mockResetBridgeState).toHaveBeenCalledTimes(1);
      const actions = mockStore.getActions();
      expect(actions.map((action) => action.type)).not.toContain(
        'bridge/resetInputFields',
      );
      expect(mockClearAllBridgeCacheItems).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetInputFields', () => {
    it('dispatches action to the bridge controller', () => {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockStore = configureMockStore<any>(middleware)(
        createBridgeMockStore({
          bridgeSliceOverrides: { fromTokenInputValue: '10' },
        }),
      );
      const state = mockStore.getState().bridge;

      mockStore.dispatch(resetInputFields() as never);

      const actions = mockStore.getActions();
      expect(actions[0].type).toStrictEqual('bridge/resetInputFields');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState).toStrictEqual({
        fromToken: null,
        fromTokenExchangeRate: null,
        fromTokenInputValue: null,
        selectedQuote: null,
        slippage: SlippageValue.BridgeDefault,
        isDestAssetPickerOpen: false,
        isSrcAssetPickerOpen: false,
        sortOrder: 'cost_ascending',
        toToken: null,
        txAlert: null,
        txAlertStatus: RequestStatus.FETCHED,
        wasTxDeclined: false,
        fromTokenBalance: null,
        fromNativeBalance: null,
      });
    });
  });

  describe('setWasTxDeclined', () => {
    it('sets the wasTxDeclined flag to true', () => {
      const state = store.getState().bridge;
      store.dispatch(setWasTxDeclined(true));
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/setWasTxDeclined');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.wasTxDeclined).toStrictEqual(true);
    });
  });
});
