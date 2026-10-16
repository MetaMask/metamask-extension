import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import { isPostQuoteWithdrawTransaction } from '../../../../../shared/lib/transactions.utils';
import { isEqualCaseInsensitive } from '../../../../../shared/lib/string-utils';
import { isHardwareAccount } from '../../../../components/app/rewards/utils/isHardwareAccount';
import { getInternalAccountByAddress } from '../../../../selectors/accounts';
import { useConfirmContext } from '../../context/confirm';
import { useTransactionPayQuotes } from './useTransactionPayData';

/**
 * Hardware account that would have to sign a post-quote withdraw's Pay quote.
 *
 * Only `txParams.from` (e.g. the money account) may sign a withdraw. Pay
 * submits a quote's transactions from `quote.request.from`, which is the
 * recipient (`accountOverride`), so a quoted withdraw would ask the recipient
 * to sign. Direct withdraws have no executable quote and never do.
 *
 * @returns The hardware signer address, or `undefined` when none.
 */
export function useWithdrawHardwareQuoteSigner(): Hex | undefined {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const quotes = useTransactionPayQuotes();

  const from = currentConfirmation?.txParams?.from;
  const signer = isPostQuoteWithdrawTransaction(currentConfirmation)
    ? quotes?.find(
        ({ request, strategy }) =>
          strategy !== TransactionPayStrategy.None &&
          !isEqualCaseInsensitive(request.from, from ?? ''),
      )?.request.from
    : undefined;

  const signerAccount = useSelector((state) =>
    signer ? getInternalAccountByAddress(state, signer) : undefined,
  );

  return signerAccount && isHardwareAccount(signerAccount) ? signer : undefined;
}
