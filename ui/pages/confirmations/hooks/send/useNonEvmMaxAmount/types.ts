import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAssetType } from '@metamask/utils';

import { Numeric } from '../../../../../../shared/lib/Numeric';

export type MaxSendableAmountRequest = {
  fromAccount: InternalAccount;
  assetId: CaipAssetType;
  toAddress?: string;
  balance: {
    rawBalanceNumeric: Numeric;
    decimals: number;
    isNative: boolean;
  };
};

export type GetMaxSendableAmount = (
  request: MaxSendableAmountRequest,
) => Promise<string>;
