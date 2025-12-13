import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  SortOrder,
  formatChainIdToCaip,
  getNativeAssetForChainId,
  calcLatestSrcBalance,
  isNonEvmChainId,
  isCrossChain,
  formatChainIdToHex,
  type GenericQuoteRequest,
  type QuoteResponse,
  isBitcoinChainId,
} from '@metamask/bridge-controller';
import { zeroAddress } from 'ethereumjs-util';
import { fetchTxAlerts } from '../../../shared/modules/bridge-utils/security-alerts-api.util';
import { endTrace, TraceName } from '../../../shared/lib/trace';
import { SlippageValue } from '../../pages/bridge/utils/slippage-service';
import { getTokenExchangeRate, toBridgeToken } from './utils';
import type { BridgeState, ChainIdPayload, TokenPayload } from './types';

const initialState: BridgeState = {
  toChainId: null,
  fromToken: null,
  toToken: null,
  fromTokenInputValue: null,
  fromTokenExchangeRate: null,
  fromTokenBalance: null,
  fromNativeBalance: null,
  sortOrder: SortOrder.COST_ASC,
  selectedQuote: null,
  wasTxDeclined: false,
  slippage: SlippageValue.BridgeDefault,
  txAlert: null,
};

export const setSrcTokenExchangeRates = createAsyncThunk(
  'bridge/setSrcTokenExchangeRates',
  getTokenExchangeRate,
);

export const setTxAlerts = createAsyncThunk(
  'bridge/setTxAlerts',
  fetchTxAlerts,
);

const getBalanceAmount = async ({
  selectedAddress,
  tokenAddress,
  chainId,
}: {
  selectedAddress?: string;
  tokenAddress: string;
  chainId: GenericQuoteRequest['srcChainId'];
}) => {
  if (isNonEvmChainId(chainId) || !selectedAddress) {
    return null;
  }
  return (
    await calcLatestSrcBalance(
      global.ethereumProvider,
      selectedAddress,
      tokenAddress,
      formatChainIdToHex(chainId),
    )
  )?.toString();
};

export const setEVMSrcNativeBalance = createAsyncThunk(
  'bridge/setEVMSrcNativeBalance',
  async ({
    selectedAddress,
    chainId,
  }: Omit<Parameters<typeof getBalanceAmount>[0], 'tokenAddress'>) =>
    await getBalanceAmount({
      selectedAddress,
      tokenAddress: zeroAddress(),
      chainId,
    }),
);

export const setEVMSrcTokenBalance = createAsyncThunk(
  'bridge/setEVMSrcTokenBalance',
  getBalanceAmount,
);

const bridgeSlice = createSlice({
  name: 'bridge',
  initialState: { ...initialState },
  reducers: {
    setToChainId: (state, { payload }: ChainIdPayload) => {
      state.toChainId = payload ? formatChainIdToCaip(payload) : null;
      state.toToken = null;
    },
    setFromToken: (state, { payload }: TokenPayload) => {
      state.fromToken = toBridgeToken(payload);
      state.fromTokenBalance = null;
      // Unset toToken if it's the same as the fromToken
      if (
        (state.fromToken?.assetId &&
          state.toToken?.assetId &&
          state.fromToken.assetId?.toLowerCase() ===
            state.toToken.assetId?.toLowerCase()) ||
        (state.fromToken?.address &&
          state.toToken?.address &&
          state.fromToken.address.toLowerCase() ===
            state.toToken.address.toLowerCase())
      ) {
        state.toToken = null;
      }
      // if new fromToken is BTC, and toToken is BTC, unset toChain and toToken
      if (
        state.fromToken?.chainId &&
        isBitcoinChainId(state.fromToken.chainId) &&
        state.toChainId &&
        isBitcoinChainId(state.toChainId)
      ) {
        state.toChainId = null;
        state.toToken = null;
      }
    },
    setToToken: (state, { payload }: TokenPayload) => {
      const toToken = toBridgeToken(payload);
      state.toToken = toToken
        ? {
            ...toToken,
            address:
              toToken.address ||
              getNativeAssetForChainId(toToken.chainId)?.address,
          }
        : toToken;
      // Update toChainId if it's different from the toToken chainId
      if (
        toToken?.chainId &&
        (state.toChainId
          ? formatChainIdToCaip(toToken.chainId) !==
            formatChainIdToCaip(state.toChainId)
          : true)
      ) {
        state.toChainId = formatChainIdToCaip(toToken.chainId);
      }
    },
    setFromTokenInputValue: (
      state,
      { payload }: { payload: string | null },
    ) => {
      state.fromTokenInputValue = payload;
    },
    resetInputFields: () => ({
      ...initialState,
    }),
    restoreQuoteRequestFromState: (
      state,
      { payload: quote }: { payload: QuoteResponse['quote'] },
    ) => {
      state.fromToken = toBridgeToken(quote.srcAsset);
      state.toToken = toBridgeToken(quote.destAsset);
      state.toChainId = formatChainIdToCaip(quote.destChainId);
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
    setSelectedQuote: (state, action) => {
      state.selectedQuote = action.payload;
    },
    setWasTxDeclined: (state, action) => {
      state.wasTxDeclined = action.payload;
    },
    setSlippage: (state, action) => {
      state.slippage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setSrcTokenExchangeRates.pending, (state) => {
      state.fromTokenExchangeRate = null;
    });
    builder.addCase(setSrcTokenExchangeRates.fulfilled, (state, action) => {
      state.fromTokenExchangeRate = action.payload ?? null;
    });
    builder.addCase(setTxAlerts.pending, (state) => {
      state.txAlert = null;
    });
    builder.addCase(setTxAlerts.fulfilled, (state, action) => {
      state.txAlert = action.payload;
    });
    builder.addCase(setTxAlerts.rejected, (state) => {
      state.txAlert = null;
    });
    builder.addCase(setEVMSrcTokenBalance.fulfilled, (state, action) => {
      const isTokenInChain = !isCrossChain(
        action.meta.arg.chainId,
        state.fromToken?.chainId,
      );
      if (
        isTokenInChain && state.fromToken?.address
          ? action.meta.arg.tokenAddress === state.fromToken.address
          : true
      ) {
        state.fromTokenBalance = action.payload?.toString() ?? null;
      }
      endTrace({
        name: TraceName.BridgeBalancesUpdated,
      });
    });
    builder.addCase(setEVMSrcTokenBalance.rejected, (state) => {
      state.fromTokenBalance = null;
      endTrace({
        name: TraceName.BridgeBalancesUpdated,
      });
    });
    builder.addCase(setEVMSrcNativeBalance.fulfilled, (state, action) => {
      state.fromNativeBalance = action.payload?.toString() ?? null;
      endTrace({
        name: TraceName.BridgeBalancesUpdated,
      });
    });
    builder.addCase(setEVMSrcNativeBalance.rejected, (state) => {
      state.fromNativeBalance = null;
      endTrace({
        name: TraceName.BridgeBalancesUpdated,
      });
    });
  },
});

export { bridgeSlice };
export default bridgeSlice.reducer;
