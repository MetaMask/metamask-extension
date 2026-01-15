import type { CaipChainId } from '@metamask/utils';
import {
  type QuoteMetadata,
  type QuoteResponse,
  SortOrder,
  RequestStatus,
} from '@metamask/bridge-controller';
import { type KeyringAccountType } from '@metamask/keyring-api';
import { type TokenListToken } from '@metamask/assets-controllers';
import { type TxAlert } from '../../../shared/types/security-alerts-api';
import type {
  MinimalAsset,
  BridgeAssetV2,
} from '../../pages/bridge/utils/tokens';

type BridgeTokenBalanceData = {
  balance: string;
  tokenFiatAmount?: number | null;
  accountType?: KeyringAccountType;
};
export type BridgeToken = BridgeAssetV2 &
  BridgeTokenBalanceData &
  Pick<TokenListToken, 'rwaData'>;

/**
 * This is the minimal network configuration used by the Swap UI
 */
export type BridgeNetwork = {
  chainId: CaipChainId;
  name: string;
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

export type TokenPayload = MinimalAsset & // Require minimal asset fields
  // Optional bridge token fields
  Partial<
    Pick<
      BridgeToken,
      Exclude<keyof BridgeToken, keyof MinimalAsset | 'chainId'>
    >
  >;
