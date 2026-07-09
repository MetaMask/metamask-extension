import { TxData } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex, add0x } from '@metamask/utils';

import {
  addHexes,
  subtractHexes,
} from '../../../../../shared/lib/conversion.utils';
import { Numeric } from '../../../../../shared/lib/Numeric';
import { toHex } from '../../../../../shared/lib/delegation/utils';
import { useDappSwapContextOptional } from '../../context/dapp-swap';
import { HEX_ZERO } from '../../components/confirm/info/shared/constants';

/**
 * Returns the gas limit that should be used when computing or displaying
 * the fee for a given transaction. Shared by `useFeeCalculations` and the
 * gas fee modal option hooks so the same value is used everywhere.
 *
 * @param transactionMeta - The transaction being displayed.
 * @returns An object with `gasLimit` (the selected display gas limit) and
 * `quotedGasLimit` (the swap-quoted gas limit if applicable, otherwise
 * `undefined`).
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

  // `gasUsed` is the gas limit actually used by the transaction in the
  // simulation environment. Start with the pre-wrap display value, then add
  // only the container overhead so the fee reflects the protected transaction
  // without losing optimized/quoted gas for the underlying action.
  const gasLimit = (
    quotedGasLimit ||
    transactionMeta?.gasUsed ||
    // While estimating gas for the transaction we add 50% gas limit
    // buffer. With `gasLimitNoBuffer` that buffer is removed. See PR
    // https://github.com/MetaMask/metamask-extension/pull/29502 for
    // more details.
    transactionMeta?.gasLimitNoBuffer ||
    transactionMeta?.txParamsOriginal?.gas ||
    transactionMeta?.txParams?.gas ||
    HEX_ZERO
  ) as Hex;

  return {
    gasLimit: addContainerGasOverhead(gasLimit, transactionMeta),
    quotedGasLimit,
  };
}

function addContainerGasOverhead(
  gasLimit: Hex,
  transactionMeta: TransactionMeta,
): Hex {
  const hasContainerTypes = (transactionMeta.containerTypes?.length ?? 0) > 0;
  const originalGas = transactionMeta.txParamsOriginal?.gas;
  const wrappedGas = transactionMeta.txParams?.gas;

  if (!hasContainerTypes || !originalGas || !wrappedGas) {
    return gasLimit;
  }

  if (!new Numeric(wrappedGas, 16).greaterThan(originalGas, 16)) {
    return gasLimit;
  }

  const overhead = subtractHexes(wrappedGas, originalGas);
  return add0x(addHexes(gasLimit, overhead)) as Hex;
}
