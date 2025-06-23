import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  SortOrder,
  BRIDGE_DEFAULT_SLIPPAGE,
  formatChainIdToCaip,
  getNativeAssetForChainId,
  isSolanaChainId,
  formatChainIdToHex,
  isNativeAddress,
} from '@metamask/bridge-controller';
import { getAssetImageUrl, toAssetId } from '../../../shared/lib/asset-utils';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../shared/constants/multichain/networks';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../shared/constants/network';
import { fetchTxAlerts } from '../../../shared/modules/bridge-utils/security-alerts-api.util';
import { getTokenExchangeRate } from './utils';
import type { BridgeState, ChainIdPayload, TokenPayload } from './types';

const initialState: BridgeState = {
  toChainId: null,
  fromToken: null,
  toToken: null,
  fromTokenInputValue: null,
  fromTokenExchangeRate: null,
  toTokenExchangeRate: null,
  toTokenUsdExchangeRate: null,
  sortOrder: SortOrder.COST_ASC,
  selectedQuote: null,
  wasTxDeclined: false,
  slippage: BRIDGE_DEFAULT_SLIPPAGE,
  txAlert: null,
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

const getTokenImage = (payload: TokenPayload['payload']) => {
  if (!payload) {
    return '';
  }
  const { image, iconUrl, icon, chainId, address, assetId } = payload;
  const caipChainId = formatChainIdToCaip(chainId);
  // If the token is native, return the SVG image asset
  if (isNativeAddress(address)) {
    if (isSolanaChainId(chainId)) {
      return MULTICHAIN_TOKEN_IMAGE_MAP[caipChainId];
    }
    return CHAIN_ID_TOKEN_IMAGE_MAP[
      formatChainIdToHex(chainId) as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
    ];
  }
  // If the token is not native, return the image from the payload
  const imageFromPayload = image ?? iconUrl ?? icon;
  if (imageFromPayload) {
    return imageFromPayload;
  }
  // If there's no image from the payload, build the asset image URL and return it
  const assetIdToUse = assetId ?? toAssetId(address, caipChainId);
  return (assetIdToUse && getAssetImageUrl(assetIdToUse, caipChainId)) ?? '';
};

const bridgeSlice = createSlice({
  name: 'bridge',
  initialState: { ...initialState },
  reducers: {
    setToChainId: (state, { payload }: ChainIdPayload) => {
      state.toChainId = payload ? formatChainIdToCaip(payload) : null;
    },
    setFromToken: (state, { payload }: TokenPayload) => {
      if (payload) {
        state.fromToken = {
          ...payload,
          balance: payload.balance ?? '0',
          string: payload.string ?? '0',
          chainId: payload.chainId,
          image: getTokenImage(payload),
        };
      } else {
        state.fromToken = payload;
      }
    },
    setToToken: (state, { payload }: TokenPayload) => {
      if (payload) {
        state.toToken = {
          ...payload,
          balance: payload.balance ?? '0',
          string: payload.string ?? '0',
          chainId: payload.chainId,
          image: getTokenImage(payload),
          address:
            payload.address ||
            getNativeAssetForChainId(payload.chainId).address,
        };
      } else {
        state.toToken = payload;
      }
    },
    setFromTokenInputValue: (state, action) => {
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
  },
});

export { bridgeSlice };
export default bridgeSlice.reducer;
