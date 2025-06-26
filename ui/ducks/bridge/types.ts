import { type Hex, type CaipChainId } from '@metamask/utils';
import {
  type QuoteMetadata,
  type QuoteResponse,
  SortOrder,
  type ChainId,
  type GenericQuoteRequest,
} from '@metamask/bridge-controller';
import { type TxAlert } from '../../../shared/types/security-alerts-api';

export type BridgeToken = {
  address: string;
  symbol: string;
  image: string;
  decimals: number;
  chainId: number | Hex | ChainId | CaipChainId;
  balance: string; // raw balance
  // TODO deprecate this field and use balance instead
  string: string | undefined; // normalized balance as a stringified number
  tokenFiatAmount?: number | null;
  occurrences?: number;
  aggregators?: string[];
};

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
  txAlert: TxAlert | null;
};

export type ChainIdPayload = { payload: ChainId | Hex | CaipChainId | null };
export type TokenPayload = {
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
