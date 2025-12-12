import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { zeroAddress } from 'ethereumjs-util';
import {
  BridgeBackgroundAction,
  BridgeUserAction,
  formatChainIdToCaip,
} from '@metamask/bridge-controller';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { setBackgroundConnection } from '../../store/background-connection';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { SlippageValue } from '../../pages/bridge/utils/slippage-service';
import bridgeReducer from './bridge';
import {
  setFromToken,
  setFromTokenInputValue,
  setToToken,
  resetInputFields,
  setToChainId,
  updateQuoteRequestParams,
  resetBridgeState,
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
          accountType: undefined,
          name: 'SYMBOL',
          tokenFiatAmount: undefined,
          balance: '0',
          assetId: 'eip155:10/erc20:0x13341431',
          chainId: 'eip155:10',
          image:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/10/erc20/0x13341431.png',
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
        slippage: SlippageValue.BridgeDefault,
        fromTokenInputValue: null,
        sortOrder: 'cost_ascending',
        fromTokenExchangeRate: null,
        wasTxDeclined: false,
        txAlert: null,
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
        slippage: SlippageValue.BridgeDefault,
        sortOrder: 'cost_ascending',
        toChainId: null,
        toToken: null,
        txAlert: null,
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
