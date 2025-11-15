import type { Hex, CaipChainId } from '@metamask/utils';
import {
  type BridgeAssetV2,
  type QuoteMetadata,
  type QuoteResponse,
  SortOrder,
} from '@metamask/bridge-controller';
import { type KeyringAccountType } from '@metamask/keyring-api';
import { type TxAlert } from '../../../shared/types/security-alerts-api';

export type BridgeToken = BridgeAssetV2 & {
  // TODO change to TokenAmountValues
  balance?: string; // raw balance
  tokenFiatAmount?: number | null;
  accountType?: KeyringAccountType;
  address: string;
  image: string;
};

export type BridgeState = {
  fromToken: BridgeToken | null;
  toToken: BridgeToken | null;
  fromTokenInputValue: string | null;
  fromTokenExchangeRate: number | null; // Exchange rate from selected token to the default currency (can be fiat or crypto)
  toTokenExchangeRate: number | null; // Exchange rate from the selected token to the default currency (can be fiat or crypto)
  toTokenUsdExchangeRate: number | null; // Exchange rate from the selected token to the USD. This is needed for metrics
  fromNativeBalance: string; // User's balance for the native token of the selected fromChain(EVM)
  fromTokenBalance: string; // User's balance for the selected token (EVM)
  sortOrder: SortOrder;
  selectedQuote: (QuoteResponse & QuoteMetadata) | null; // Alternate quote selected by user. When quotes refresh, the best match will be activated.
  wasTxDeclined: boolean; // Whether the user declined the transaction. Relevant for hardware wallets.
  slippage?: number;
  txAlert: TxAlert | null;
};

export type TokenPayload = {
  payload:
    | (Omit<BridgeToken, 'image' | 'chainId' | 'address'> & {
        address?: string;
        image?: string | null;
        chainId?: number | CaipChainId | Hex;
      })
    | null;
};
