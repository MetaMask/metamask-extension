import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { zeroAddress } from 'ethereumjs-util';
import {
  BridgeBackgroundAction,
  BridgeUserAction,
  BRIDGE_DEFAULT_SLIPPAGE,
  formatChainIdToCaip,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import * as controllerUtils from '@metamask/controller-utils';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { toAssetId } from '../../../shared/lib/asset-utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { setBackgroundConnection } from '../../store/background-connection';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import bridgeReducer from './bridge';
import {
  setFromToken,
  setFromTokenInputValue,
  setToToken,
  resetInputFields,
  setToChainId,
  updateQuoteRequestParams,
  resetBridgeState,
  setDestTokenExchangeRates,
  setWasTxDeclined,
  setSlippage,
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

  describe('setToChainId', () => {
    it('calls the "bridge/setToChainId" action', () => {
      const state = store.getState().bridge;
      const actionPayload = CHAIN_IDS.OPTIMISM;

      store.dispatch(setToChainId(actionPayload as never) as never);

      // Check redux state
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/setToChainId');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.toChainId).toStrictEqual(
        formatChainIdToCaip(actionPayload),
      );
    });
  });

  describe('setFromToken', () => {
    it('calls the "bridge/setFromToken" action', () => {
      const state = store.getState().bridge;
      const actionPayload = {
        symbol: 'SYMBOL',
        address: '0x13341432',
        chainId: MultichainNetworks.SOLANA,
      };
      store.dispatch(setFromToken(actionPayload as never) as never);
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/setFromToken');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.fromToken).toStrictEqual(
        expect.objectContaining(actionPayload),
      );
    });
  });

  describe('setToToken', () => {
    it('calls the "bridge/setToToken" action', () => {
      const state = store.getState().bridge;
      const actionPayload = {
        symbol: 'SYMBOL',
        address: '0x13341431',
        chainId: '0xa',
      };

      store.dispatch(setToToken(actionPayload as never) as never);
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/setToToken');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.toToken).toStrictEqual(
        expect.objectContaining({
          ...actionPayload,
          balance: '0',
          assetId: 'eip155:10/erc20:0x13341431',
          chainId: '0xa',
          image:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/10/erc20/0x13341431.png',
          string: '0',
        }),
      );
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
      store.dispatch(resetInputFields());
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/resetInputFields');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState).toStrictEqual({
        selectedQuote: null,
        toChainId: null,
        fromToken: null,
        toToken: null,
        slippage: BRIDGE_DEFAULT_SLIPPAGE,
        fromTokenInputValue: null,
        sortOrder: 'cost_ascending',
        toTokenExchangeRate: null,
        fromTokenExchangeRate: null,
        wasTxDeclined: false,
        txAlert: null,
        toTokenUsdExchangeRate: null,
        fromTokenBalance: null,
        fromNativeBalance: null,
      });
    });
  });

  describe('updateQuoteRequestParams', () => {
    it('dispatches quote params to the bridge controller', () => {
      const mockUpdateParams = jest.fn();
      setBackgroundConnection({
        [BridgeUserAction.UPDATE_QUOTE_PARAMS]: mockUpdateParams,
      } as never);

      store.dispatch(
        updateQuoteRequestParams(
          {
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
          },
        ) as never,
      );

      expect(mockUpdateParams).toHaveBeenCalledTimes(1);
      expect(mockUpdateParams).toHaveBeenCalledWith(
        {
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
        },
      );
    });
  });

  describe('resetBridgeState', () => {
    it('dispatches action to the bridge controller', () => {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockStore = configureMockStore<any>(middleware)(
        createBridgeMockStore({
          bridgeSliceOverrides: { fromTokenInputValue: '10' },
        }),
      );
      const state = mockStore.getState().bridge;
      const mockResetBridgeState = jest.fn();
      setBackgroundConnection({
        [BridgeBackgroundAction.RESET_STATE]: mockResetBridgeState,
      } as never);

      mockStore.dispatch(resetBridgeState() as never);

      expect(mockResetBridgeState).toHaveBeenCalledTimes(1);
      expect(mockResetBridgeState).toHaveBeenCalledWith();
      const actions = mockStore.getActions();
      expect(actions[0].type).toStrictEqual('bridge/resetInputFields');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState).toStrictEqual({
        fromToken: null,
        fromTokenExchangeRate: null,
        fromTokenInputValue: null,
        selectedQuote: null,
        slippage: BRIDGE_DEFAULT_SLIPPAGE,
        sortOrder: 'cost_ascending',
        toChainId: null,
        toToken: null,
        txAlert: null,
        toTokenExchangeRate: null,
        wasTxDeclined: false,
        toTokenUsdExchangeRate: null,
        fromTokenBalance: null,
        fromNativeBalance: null,
      });
    });
  });

  describe('setDestTokenExchangeRates', () => {
    it('fetches token prices and updates dest exchange rates in state, native dest token', async () => {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockStore = configureMockStore<any>(middleware)(
        createBridgeMockStore(),
      );
      const state = mockStore.getState().bridge;
      const fetchTokenExchangeRatesSpy = jest
        .spyOn(controllerUtils, 'handleFetch')
        .mockResolvedValue({
          [getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET).assetId]: {
            price: 0.356628,
          },
        });

      await mockStore.dispatch(
        setDestTokenExchangeRates({
          chainId: CHAIN_IDS.LINEA_MAINNET,
          tokenAddress: zeroAddress(),
          currency: 'usd',
        }) as never,
      );

      expect(fetchTokenExchangeRatesSpy).toHaveBeenCalledTimes(1);
      expect(fetchTokenExchangeRatesSpy).toHaveBeenCalledWith(
        'https://price.api.cx.metamask.io/v3/spot-prices?assetIds=eip155%3A59144%2Fslip44%3A60&includeMarketData=true&vsCurrency=usd',
        {
          headers: { 'X-Client-Id': 'extension' },
          method: 'GET',
          signal: undefined,
        },
      );

      const actions = mockStore.getActions();
      expect(actions).toHaveLength(2);
      expect(actions[0].type).toStrictEqual(
        'bridge/setDestTokenExchangeRates/pending',
      );
      expect(actions[1].type).toStrictEqual(
        'bridge/setDestTokenExchangeRates/fulfilled',
      );
      const newState = bridgeReducer(state, actions[1]);
      expect(newState).toStrictEqual({
        toChainId: null,
        toTokenExchangeRate: 0.356628,
        sortOrder: 'cost_ascending',
      });
    });

    it('fetches token prices and updates dest exchange rates in state, erc20 dest token', async () => {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockStore = configureMockStore<any>(middleware)(
        createBridgeMockStore(),
      );
      const state = mockStore.getState().bridge;
      const fetchTokenExchangeRatesSpy = jest
        .spyOn(controllerUtils, 'handleFetch')
        .mockResolvedValue({
          [toAssetId(
            '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'.toLowerCase(),
            formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET),
          ) as never]: {
            price: 0.999881,
          },
        });

      await mockStore.dispatch(
        setDestTokenExchangeRates({
          chainId: CHAIN_IDS.LINEA_MAINNET,
          tokenAddress:
            '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'.toLowerCase(),
          currency: 'usd',
        }) as never,
      );

      expect(fetchTokenExchangeRatesSpy).toHaveBeenCalledTimes(1);
      expect(fetchTokenExchangeRatesSpy).toHaveBeenCalledWith(
        'https://price.api.cx.metamask.io/v3/spot-prices?assetIds=eip155%3A59144%2Ferc20%3A0x3c499c542cef5e3811e1192ce70d8cc03d5c3359&includeMarketData=true&vsCurrency=usd',
        {
          headers: { 'X-Client-Id': 'extension' },
          method: 'GET',
          signal: undefined,
        },
      );

      const actions = mockStore.getActions();
      expect(actions).toHaveLength(2);
      expect(actions[0].type).toStrictEqual(
        'bridge/setDestTokenExchangeRates/pending',
      );
      expect(actions[1].type).toStrictEqual(
        'bridge/setDestTokenExchangeRates/fulfilled',
      );
      const newState = bridgeReducer(state, actions[1]);
      expect(newState).toStrictEqual({
        toChainId: null,
        toTokenExchangeRate: 0.999881,
        sortOrder: 'cost_ascending',
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
