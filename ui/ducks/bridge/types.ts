import type { Hex, CaipChainId, CaipAssetType } from '@metamask/utils';
import {
  type QuoteMetadata,
  type QuoteResponse,
  SortOrder,
  type ChainId,
  type GenericQuoteRequest,
  RequestStatus,
} from '@metamask/bridge-controller';
import { type KeyringAccountType } from '@metamask/keyring-api';
import { type TxAlert } from '../../../shared/types/security-alerts-api';

export type BridgeToken = {
  address: string;
  assetId?: CaipAssetType;
  symbol: string;
  image: string;
  name: string;
  decimals: number;
  chainId: number | Hex | ChainId | CaipChainId;
  balance: string; // raw balance
  tokenFiatAmount?: number | null;
  occurrences?: number;
  aggregators?: string[];
  accountType?: KeyringAccountType;
};

/**
 * This is the minimal network configuration used by the Swap UI
 */
export type BridgeNetwork = {
  name: string;
  nativeCurrency: string;
  chainId: Hex | CaipChainId;
};

export type BridgeState = {
  fromToken: BridgeToken | null;
  toToken: BridgeToken | null;
  fromTokenInputValue: string | null;
  fromTokenExchangeRate: number | null; // Exchange rate from selected token to the default currency (can be fiat or crypto)
  fromNativeBalance: string | null; // User's balance for the native token of the selected fromChain(EVM)
  fromTokenBalance: string | null; // User's balance for the selected token (EVM)
  sortOrder: SortOrder;
  selectedQuote: (QuoteResponse & QuoteMetadata) | null; // Alternate quote selected by user. When quotes refresh, the best match will be activated.
  wasTxDeclined: boolean; // Whether the user declined the transaction. Relevant for hardware wallets.
  slippage?: number;
  txAlert: TxAlert | null;
  txAlertStatus: RequestStatus;
};

export type TokenPayload = {
  payload: {
    address: GenericQuoteRequest['srcTokenAddress'];
    symbol: string;
    decimals: number;
    chainId: ChainId | Hex | CaipChainId;
    name?: string;
    balance?: string;
    image?: string;
    iconUrl?: string | null;
    icon?: string | null;
    assetId?: CaipAssetType;
    aggregators?: string[];
    occurrences?: number;
  };
};
