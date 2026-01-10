import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  SortOrder,
  calcLatestSrcBalance,
  isNonEvmChainId,
  formatChainIdToHex,
  type QuoteResponse,
  isNativeAddress,
  RequestStatus,
} from '@metamask/bridge-controller';
import { zeroAddress } from 'ethereumjs-util';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { fetchTxAlerts } from '../../../shared/modules/bridge-utils/security-alerts-api.util';
import { trace, TraceName } from '../../../shared/lib/trace';
import { SlippageValue } from '../../pages/bridge/utils/slippage-service';
import { getTokenExchangeRate, toBridgeToken } from './utils';
import type { BridgeState, TokenPayload } from './types';

const initialState: BridgeState = {
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
  txAlertStatus: RequestStatus.FETCHED,
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
  chainId: CaipChainId;
}) => {
  if (isNonEvmChainId(chainId) || !selectedAddress) {
    return null;
  }
  const isNative = isNativeAddress(tokenAddress);

  return await trace(
    {
      name: TraceName.BridgeBalancesUpdated,
      data: {
        srcChainId: chainId,
        isNative,
      },
      startTime: Date.now(),
    },
    async () =>
      (
        await calcLatestSrcBalance(
          global.ethereumProvider,
          selectedAddress,
          isNative ? zeroAddress() : tokenAddress,
          formatChainIdToHex(chainId),
        )
      )?.toString(),
  );
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
  async (
    token: Parameters<typeof getBalanceAmount>[0] & { assetId: CaipAssetType },
  ) => await getBalanceAmount(token),
);

const bridgeSlice = createSlice({
  name: 'bridge',
  initialState: { ...initialState },
  reducers: {
    setFromToken: (state, { payload }: TokenPayload) => {
      const currentFromToken = { ...state.fromToken };
      state.fromToken = toBridgeToken(payload);
      state.fromTokenBalance = initialState.fromTokenBalance;
      state.fromTokenExchangeRate = initialState.fromTokenExchangeRate;
      state.fromNativeBalance = initialState.fromNativeBalance;
      state.fromTokenInputValue = initialState.fromTokenInputValue;
      state.txAlertStatus = initialState.txAlertStatus;
      state.txAlert = initialState.txAlert;
      // Set toToken to previous fromToken if new fromToken is the same as the current toToken
      if (
        state.fromToken?.assetId &&
        state.toToken?.assetId &&
        state.fromToken.assetId.toLowerCase() ===
          state.toToken.assetId.toLowerCase()
      ) {
        state.toToken = currentFromToken;
      }
    },
    setToToken: (state, { payload }: TokenPayload) => {
      state.toToken = payload ? toBridgeToken(payload) : null;
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
      // Update status but persist the previous alert
      // The txAlert is only reset the src token changes or if a new response is fetched
      state.txAlertStatus = RequestStatus.LOADING;
    });
    builder.addCase(setTxAlerts.fulfilled, (state, action) => {
      state.txAlert = action.payload;
      state.txAlertStatus = RequestStatus.FETCHED;
    });
    builder.addCase(setTxAlerts.rejected, (state, action) => {
      // Ignore abort errors because they are expected when streaming quotes
      if (action.error.name === 'AbortError') {
        return;
      }
      state.txAlert = initialState.txAlert;
      state.txAlertStatus = RequestStatus.ERROR;
    });
    builder.addCase(setEVMSrcTokenBalance.fulfilled, (state, action) => {
      if (
        state.fromToken
          ? action.meta.arg.assetId.toLowerCase() ===
            state.fromToken.assetId.toLowerCase()
          : true
      ) {
        state.fromTokenBalance = action.payload ?? '0';
      }
    });
    builder.addCase(setEVMSrcTokenBalance.rejected, (state) => {
      state.fromTokenBalance = '0';
    });
    builder.addCase(setEVMSrcNativeBalance.fulfilled, (state, action) => {
      if (
        state.fromToken?.chainId &&
        state.fromToken.chainId === action.meta.arg.chainId
      ) {
        state.fromNativeBalance = action.payload?.toString() ?? '0';
      }
    });
    builder.addCase(setEVMSrcNativeBalance.rejected, (state) => {
      state.fromNativeBalance = '0';
    });
  },
});

export { bridgeSlice };
export default bridgeSlice.reducer;
