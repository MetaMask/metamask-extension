import type { Hex, CaipChainId } from '@metamask/utils';
import {
  type QuoteMetadata,
  type QuoteResponse,
  SortOrder,
  type ChainId,
} from '@metamask/bridge-controller';
import {
  CaipAssetTypeStruct,
  CaipChainIdStruct,
  type KeyringAccountType,
} from '@metamask/keyring-api';
import {
  optional,
  string,
  type,
  number,
  boolean,
  type Infer,
} from '@metamask/superstruct';
import { type TxAlert } from '../../../shared/types/security-alerts-api';

export const BridgeAssetV2Schema = type({
  assetId: CaipAssetTypeStruct,
  symbol: string(),
  decimals: number(),
  name: string(),
  image: string(),
  chainId: CaipChainIdStruct,
  noFee: optional(
    type({
      isDestination: boolean(),
      isSource: boolean(),
    }),
  ),
});

export type BridgeToken = Infer<typeof BridgeAssetV2Schema> & {
  balance?: string; // raw balance
  tokenFiatAmount?: number | null;
  accountType?: KeyringAccountType;
};

export type BridgeState = {
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
};

export type TokenPayload = {
  payload:
    | (Omit<BridgeToken, 'image' | 'chainId'> & {
        address?: string;
        image?: string;
        chainId: number | CaipChainId | Hex;
      })
    | null;
};
