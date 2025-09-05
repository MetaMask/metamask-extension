import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  SortOrder,
  BRIDGE_DEFAULT_SLIPPAGE,
  formatChainIdToCaip,
  getNativeAssetForChainId,
  calcLatestSrcBalance,
  isSolanaChainId,
  isCrossChain,
  formatChainIdToHex,
  type GenericQuoteRequest,
} from '@metamask/bridge-controller';
import { zeroAddress } from 'ethereumjs-util';
import { fetchTxAlerts } from '../../../shared/modules/bridge-utils/security-alerts-api.util';
import { endTrace, TraceName } from '../../../shared/lib/trace';
import { getTokenExchangeRate, toBridgeToken } from './utils';
import type {
  BridgeState,
  ChainIdPayload,
  TokenPayload,
  DestinationAccount,
} from './types';

const initialState: BridgeState = {
  toChainId: null,
  fromToken: null,
  toToken: null,
  fromTokenInputValue: null,
  fromTokenExchangeRate: null,
  toTokenExchangeRate: null,
  toTokenUsdExchangeRate: null,
  fromTokenBalance: null,
  fromNativeBalance: null,
  sortOrder: SortOrder.COST_ASC,
  selectedQuote: null,
  wasTxDeclined: false,
  slippage: BRIDGE_DEFAULT_SLIPPAGE,
  txAlert: null,
  toAccount: null,
};

export const setSrcTokenExchangeRates = createAsyncThunk(
  'bridge/setSrcTokenExchangeRates',
  getTokenExchangeRate,
);

export const setDestTokenExchangeRates = createAsyncThunk(
  'bridge/setDestTokenExchangeRates',
  getTokenExchangeRate,
);

export const setDestTokenUsdExchangeRates = createAsyncThunk(
  'bridge/setDestTokenUsdExchangeRates',
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
  if (isSolanaChainId(chainId) || !selectedAddress) {
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
  initialState,
  reducers: {
    setToChainId: (state, action: ChainIdPayload) => {
      const newToChainIdInCaip = action.payload
        ? formatChainIdToCaip(action.payload)
        : null;
      state.toChainId = newToChainIdInCaip;
      state.toToken = null;
      // If there is a toAccount selection, unset if it's not compatible with the new toChain
      const isToAccountCompatibleWithToChain =
        newToChainIdInCaip &&
        state.toAccount &&
        state.toAccount.type.split(':')[0] === newToChainIdInCaip.split(':')[0];
      if (!isToAccountCompatibleWithToChain) {
        state.toAccount = null;
      }
    },
    setFromToken: (state, action: TokenPayload) => {
      state.fromToken = toBridgeToken(action.payload);
      state.fromTokenBalance = null;
      // Unset toToken if it's the same as the fromToken
      if (
        state.fromToken?.assetId &&
        state.toToken?.assetId &&
        state.fromToken.assetId.toLowerCase() ===
          state.toToken.assetId.toLowerCase()
      ) {
        state.toToken = null;
      }
    },
    setToToken: (state, action: TokenPayload) => {
      const toToken = toBridgeToken(action.payload);
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
        state.toAccount = null;
      }
    },
    setFromTokenInputValue: (state, action: { payload: string | null }) => {
      state.fromTokenInputValue = action.payload;
    },
    resetInputFields: () => ({
      ...initialState,
    }),
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
    setToAccount: (state, action: { payload: DestinationAccount | null }) => {
      state.toAccount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setDestTokenExchangeRates.pending, (state) => {
      state.toTokenExchangeRate = null;
    });
    builder.addCase(setDestTokenUsdExchangeRates.pending, (state) => {
      state.toTokenUsdExchangeRate = null;
    });
    builder.addCase(setSrcTokenExchangeRates.pending, (state) => {
      state.fromTokenExchangeRate = null;
    });
    builder.addCase(setDestTokenExchangeRates.fulfilled, (state, action) => {
      state.toTokenExchangeRate = action.payload ?? null;
    });
    builder.addCase(setDestTokenUsdExchangeRates.fulfilled, (state, action) => {
      state.toTokenUsdExchangeRate = action.payload ?? null;
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
