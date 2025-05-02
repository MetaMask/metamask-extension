import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { type Hex, type CaipChainId } from '@metamask/utils';
import {
  type BridgeToken,
  type QuoteMetadata,
  type QuoteResponse,
  SortOrder,
  BRIDGE_DEFAULT_SLIPPAGE,
  formatChainIdToCaip,
  getNativeAssetForChainId,
  type ChainId,
  type GenericQuoteRequest,
  isSolanaChainId,
  formatChainIdToHex,
  isNativeAddress,
} from '@metamask/bridge-controller';
import { getAssetImageUrl, toAssetId } from '../../../shared/lib/asset-utils';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../shared/constants/multichain/networks';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../shared/constants/network';
import { getTokenExchangeRate } from './utils';

export type BridgeState = {
  toChainId: CaipChainId | null;
  fromToken: BridgeToken | null;
  toToken: BridgeToken | null;
  fromTokenInputValue: string | null;
  fromTokenExchangeRate: number | null; // Exchange rate from selected token to the default currency (can be fiat or crypto)
  toTokenExchangeRate: number | null; // Exchange rate from the selected token to the default currency (can be fiat or crypto)
  toTokenUsdExchangeRate: number | null; // Exchange rate from the selected token to the USD. This is needed for metrics
  sortOrder: SortOrder;
  selectedQuote: (QuoteResponse & QuoteMetadata) | null; // Alternate quote selected by user. When quotes refresh, the best match will be activated.
  wasTxDeclined: boolean; // Whether the user declined the transaction. Relevant for hardware wallets.
  slippage?: number;
};

type ChainIdPayload = { payload: ChainId | Hex | CaipChainId | null };
type TokenPayload = {
  payload: {
    address: GenericQuoteRequest['srcTokenAddress'];
    symbol: string;
    decimals: number;
    chainId: Exclude<ChainIdPayload['payload'], null>;
    balance?: string;
    string?: string;
    image?: string;
    iconUrl?: string;
    icon?: string;
    assetId?: string;
  } | null;
};

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
  },
});

export { bridgeSlice };
export default bridgeSlice.reducer;
