import type { Hex, CaipChainId, CaipAssetType } from '@metamask/utils';
import { type InternalAccount } from '@metamask/keyring-internal-api';
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
  assetId?: CaipAssetType;
  symbol: string;
  image: string;
  decimals: number;
  chainId: number | Hex | ChainId | CaipChainId;
  balance: string; // raw balance
  /**
   * @deprecated Use balance property instead
   *
   * normalized balance as a stringified number
   */
  string: string | undefined;
  tokenFiatAmount?: number | null;
  occurrences?: number;
  aggregators?: string[];
};

/**
 * Destination accounts are the accounts that the user can select to swap to
 * These can be either
 *   - Internal destination accounts are part of the user's internal account tree. This is populated by the getToAccount selector
 *   - External destination accounts are not part of the user's internal account tree,
 *     and are typically ENS domains or other external accounts. This is populated by the
 *     useExternalAccountResolution hook
 */
export type DestinationAccount = {
  address: InternalAccount['address'];
  type: InternalAccount['type'];
  isExternal: boolean;
  /**
   * This is used to display the account name in the account picker
   * If the account is external, this is the ENS domain name, or a placeholder label
   * If the account is internal, this is the name of the account group that the account belongs to
   */
  displayName: string;
};

export type BridgeState = {
  /*
   * This stores the user's selected destination chain, and will be null if the user has not selected a destination chain
   * This should not be accessed directly in components/hooks, use the getToChain selector instead
   * The getToChain selector uses the source chain as the destination chain by default if toChainId is null
   */
  toChainId: CaipChainId | null;
  fromToken: BridgeToken | null;
  toToken: BridgeToken | null;
  fromTokenInputValue: string | null;
  fromTokenExchangeRate: number | null; // Exchange rate from selected token to the default currency (can be fiat or crypto)
  toTokenExchangeRate: number | null; // Exchange rate from the selected token to the default currency (can be fiat or crypto)
  toTokenUsdExchangeRate: number | null; // Exchange rate from the selected token to the USD. This is needed for metrics
  fromNativeBalance: string | null; // User's balance for the native token of the selected fromChain(EVM)
  fromTokenBalance: string | null; // User's balance for the selected token (EVM)
  sortOrder: SortOrder;
  selectedQuote: (QuoteResponse & QuoteMetadata) | null; // Alternate quote selected by user. When quotes refresh, the best match will be activated.
  wasTxDeclined: boolean; // Whether the user declined the transaction. Relevant for hardware wallets.
  slippage?: number;
  txAlert: TxAlert | null;
  toAccount: DestinationAccount | null;
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
    iconUrl?: string | null;
    icon?: string | null;
    assetId?: CaipAssetType;
    aggregators?: string[];
    occurrences?: number;
  } | null;
};
