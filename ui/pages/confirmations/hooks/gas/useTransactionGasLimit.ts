import { TxData } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';

import { toHex } from '../../../../../shared/lib/delegation/utils';
import { useDappSwapContextOptional } from '../../context/dapp-swap';
import { HEX_ZERO } from '../../components/confirm/info/shared/constants';

/**
 * Returns the gas limits that should be used when computing or displaying
 * fees for a given transaction. Extracted from `useFeeCalculations` so that
 * gas-limit selection can be reused by the gas fee modal option hooks
 * without pulling in the rest of the fee calculation machinery.
 *
 * Two gas limits are returned because the confirmation screen's main fee
 * row and the gas fee modal's option rows historically used slightly
 * different priority chains; this hook preserves both while adding
 * container-wrapping awareness to both.
 *
 * @param transactionMeta - The transaction being displayed.
 * @returns An object with `gasLimit` (full priority chain used by
 * `useFeeCalculations` to compute the displayed fee — prefers `gasUsed`
 * from simulation), `modalGasLimit` (priority used by the gas fee modal
 * option rows — prefers `gasLimitNoBuffer`) and `quotedGasLimit` (the
 * swap-quoted gas limit if applicable, otherwise `undefined`; exposed for
 * callers that still need it such as `useTransactionGasFeeEstimate`). When
 * `containerTypes` is set (e.g. enforced simulations) both `gasLimit` and
 * `modalGasLimit` resolve to the wrapped `txParams.gas`.
 */
export function useTransactionGasLimit(transactionMeta: TransactionMeta): {
  gasLimit: Hex;
  modalGasLimit: Hex;
  quotedGasLimit: Hex | undefined;
} {
  const dappSwapContext = useDappSwapContextOptional();
  const selectedQuote = dappSwapContext?.selectedQuote;
  const isQuotedSwapDisplayedInInfo =
    dappSwapContext?.isQuotedSwapDisplayedInInfo ?? false;

  let quotedGasLimit: Hex | undefined;
  if (isQuotedSwapDisplayedInInfo) {
    quotedGasLimit = toHex(
      ((selectedQuote?.approval as TxData)?.gasLimit ?? 0) +
        ((selectedQuote?.trade as TxData)?.gasLimit ?? 0),
    ) as Hex;
  }

  // When container types are set (e.g. enforced simulations), the gas limit
  // has been re-estimated for the wrapped transaction, so we use
  // `txParams.gas` directly. `gasUsed` / `gasLimitNoBuffer` reflect the
  // pre-wrap estimate and would understate the fee.
  const hasContainerTypes = (transactionMeta?.containerTypes?.length ?? 0) > 0;
  const wrappedGas = (transactionMeta?.txParams?.gas || HEX_ZERO) as Hex;

  // `gasUsed` is the gas limit actually used by the transaction in the
  // simulation environment.
  const gasLimit = (
    hasContainerTypes
      ? wrappedGas
      : quotedGasLimit ||
        transactionMeta?.gasUsed ||
        // While estimating gas for the transaction we add 50% gas limit
        // buffer. With `gasLimitNoBuffer` that buffer is removed. See PR
        // https://github.com/MetaMask/metamask-extension/pull/29502 for
        // more details.
        transactionMeta?.gasLimitNoBuffer ||
        transactionMeta?.txParams?.gas ||
        HEX_ZERO
  ) as Hex;

  const modalGasLimit = (
    hasContainerTypes
      ? wrappedGas
      : transactionMeta?.gasLimitNoBuffer || HEX_ZERO
  ) as Hex;

  return { gasLimit, modalGasLimit, quotedGasLimit };
}
