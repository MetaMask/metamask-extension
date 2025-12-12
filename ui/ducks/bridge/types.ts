import type { Hex, CaipChainId, CaipAssetType } from '@metamask/utils';
import {
  type QuoteMetadata,
  type QuoteResponse,
  SortOrder,
  type ChainId,
} from '@metamask/bridge-controller';
import { type KeyringAccountType } from '@metamask/keyring-api';
import { type TxAlert } from '../../../shared/types/security-alerts-api';
import { type BridgeAssetV2 } from '../../pages/bridge/utils/tokens';

export type BridgeToken = BridgeAssetV2 & {
  balance: string;
  tokenFiatAmount?: number | null;
  /**
   * @deprecated Can be removed when all tokens come from the bridge-api
   */
  occurrences?: number;
  /**
   * @deprecated Can be removed when all tokens come from the bridge-api
   */
  aggregators?: string[];
  accountType?: KeyringAccountType;
  /**
   * @deprecated Should be removed when all tokens come from the bridge-api
   */
  address?: string;
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
  fromNativeBalance: string | null; // User's balance for the native token of the selected fromChain(EVM)
  fromTokenBalance: string | null; // User's balance for the selected token (EVM)
  sortOrder: SortOrder;
  selectedQuote: (QuoteResponse & QuoteMetadata) | null; // Alternate quote selected by user. When quotes refresh, the best match will be activated.
  wasTxDeclined: boolean; // Whether the user declined the transaction. Relevant for hardware wallets.
  slippage?: number;
  txAlert: TxAlert | null;
};

export type ChainIdPayload = { payload: ChainId | Hex | CaipChainId | null };
export type TokenPayload = {
  payload: Omit<BridgeToken, 'chainId' | 'balance' | 'assetId' | 'name'> & {
    chainId: number | CaipChainId | Hex;
    balance?: string;
    assetId?: CaipAssetType;
    name?: string;
  };
};
