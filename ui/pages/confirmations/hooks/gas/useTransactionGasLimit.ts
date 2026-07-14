import { TxData } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';

import { toHex } from '../../../../../shared/lib/delegation/utils';
import { useDappSwapContextOptional } from '../../context/dapp-swap';
import { HEX_ZERO } from '../../components/confirm/info/shared/constants';
import {
  getDappSwapQuoteDebugInfo,
  logConfirmationTransactionDebug,
} from '../../utils/enforced-simulations-debug';

/**
 * Returns the gas limit that should be used when computing or displaying
 * the fee for a given transaction. Shared by `useFeeCalculations` and the
 * gas fee modal option hooks so the same value is used everywhere.
 *
 * @param transactionMeta - The transaction being displayed.
 * @returns An object with `gasLimit` (the selected gas limit) and
 * `quotedGasLimit` (the swap-quoted gas limit if applicable, otherwise
 * `undefined`; exposed for callers that still need it such as
 * `useTransactionGasFeeEstimate`). When `containerTypes` is set (e.g.
 * enforced simulations) `gasLimit` resolves to the wrapped `txParams.gas`.
 */
export function useTransactionGasLimit(transactionMeta: TransactionMeta): {
  gasLimit: Hex;
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

  // `gasUsed` is the gas limit actually used by the transaction in the
  // simulation environment.
  const gasLimit = (
    hasContainerTypes
      ? transactionMeta?.txParams?.gas || HEX_ZERO
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

  let gasLimitSource: string;
  if (hasContainerTypes) {
    gasLimitSource = transactionMeta?.txParams?.gas ? 'txParams.gas' : 'zero';
  } else if (quotedGasLimit) {
    gasLimitSource = 'quotedGasLimit';
  } else if (transactionMeta?.gasUsed) {
    gasLimitSource = 'gasUsed';
  } else if (transactionMeta?.gasLimitNoBuffer) {
    gasLimitSource = 'gasLimitNoBuffer';
  } else if (transactionMeta?.txParams?.gas) {
    gasLimitSource = 'txParams.gas';
  } else {
    gasLimitSource = 'zero';
  }

  logConfirmationTransactionDebug('gas-limit-calculated', transactionMeta, {
    hasContainerTypes,
    isQuotedSwapDisplayedInInfo,
    gasLimitSource,
    selectedGasLimit: gasLimit,
    quotedGasLimit,
    gasCandidates: {
      txParamsGas: transactionMeta?.txParams?.gas,
      gasUsed: transactionMeta?.gasUsed,
      gasLimitNoBuffer: transactionMeta?.gasLimitNoBuffer,
      txParamsOriginalGas: transactionMeta?.txParamsOriginal?.gas,
    },
    selectedQuote: getDappSwapQuoteDebugInfo(selectedQuote),
  });

  return { gasLimit, quotedGasLimit };
}
