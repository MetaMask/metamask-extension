import { isTronAddress } from '../../../../../../shared/lib/multichain/accounts';
import { Numeric } from '../../../../../../shared/lib/Numeric';
import { getMaxSendableAmountMultichain } from '../../../utils/multichain-snaps';
import { toTokenMinimalUnit } from '../../../utils/send';
import type { GetMaxSendableAmount } from './types';

// Worst-case native TRX fee: 1.1 TRX in sun (TRX always has 6 decimals).
const TRON_NATIVE_MAX_FEE_RESERVE = new Numeric('1100000', 10);

export const getTronMaxSendableAmount: GetMaxSendableAmount = async ({
  fromAccount,
  assetId,
  toAddress,
  balance,
}) => {
  try {
    const result = await getMaxSendableAmountMultichain(fromAccount, {
      accountId: fromAccount.id,
      assetId,
      // Passing the recipient when it is already known gives a tighter quote.
      ...(toAddress && isTronAddress(toAddress) ? { toAddress } : {}),
    });

    if (result?.amount) {
      return result.amount;
    }
  } catch {
    // Snap unavailable or not installed: fall back to the estimate below.
  }

  // A TRC-20 transfer pays its fees in TRX, so its balance stays whole.
  const maxValue = balance.isNative
    ? balance.rawBalanceNumeric.minus(TRON_NATIVE_MAX_FEE_RESERVE)
    : balance.rawBalanceNumeric;

  if (maxValue.isNegative()) {
    return '0';
  }

  return toTokenMinimalUnit(maxValue.toString(), balance.decimals, 10) ?? '0';
};
