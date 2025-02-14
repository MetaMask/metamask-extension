import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { getShouldShowFiat } from '../../../selectors';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { isEIP1559Transaction } from '../../../../shared/modules/transaction.utils';

import {
  subtractHexes,
  sumHexes,
} from '../../../../shared/modules/conversion.utils';
import {
  calcTokenAmount,
  getSwapsTokensReceivedFromTxMeta,
} from '../../../../shared/lib/transactions-controller-utils';
import { CONFIRMED_STATUS } from '../transaction-activity-log/transaction-activity-log.constants';
import { MetaMaskReduxState } from '../../../store/store';
import { calcHexGasTotal } from '../../../../shared/lib/transaction-breakdown-utils';

export const getTransactionBreakdownData = ({
  state,
  transaction,
  isTokenApprove,
}: {
  state: MetaMaskReduxState;
  transaction: TransactionMeta;
  isTokenApprove: boolean;
}) => {
  const {
    txParams: { gas, gasPrice, maxFeePerGas, value } = {},
    txReceipt: { gasUsed, effectiveGasPrice, l1Fee: l1HexGasTotal } = {},
    baseFeePerGas,
    sourceTokenAmount: rawSourceTokenAmount,
    sourceTokenDecimals,
    sourceTokenSymbol,
    destinationTokenAddress,
    destinationTokenAmount: rawDestinationTokenAmountEstimate,
    destinationTokenDecimals,
    destinationTokenSymbol,
    status,
    type,
  } = transaction;

  const sourceTokenAmount =
    rawSourceTokenAmount && sourceTokenDecimals
      ? calcTokenAmount(rawSourceTokenAmount, sourceTokenDecimals).toFixed()
      : undefined;
  let destinationTokenAmount;

  if (
    type === TransactionType.swapAndSend &&
    // ensure fallback values are available
    rawDestinationTokenAmountEstimate &&
    destinationTokenDecimals &&
    destinationTokenSymbol
  ) {
    try {
      // try to get the actual destination token amount from the on-chain events
      destinationTokenAmount = getSwapsTokensReceivedFromTxMeta(
        destinationTokenSymbol,
        transaction,
        destinationTokenAddress,
        undefined,
        destinationTokenDecimals,
        undefined,
        undefined,
        // @ts-expect-error TODO: fix this, ported directly from original code
        null,
      );

      // if no amount is found, throw
      if (!destinationTokenAmount) {
        throw new Error('Actual destination token amount not found');
      }
    } catch (error) {
      // if actual destination token amount is not found, use the estimated amount from the quote
      destinationTokenAmount =
        rawDestinationTokenAmountEstimate && destinationTokenDecimals
          ? calcTokenAmount(
              rawDestinationTokenAmountEstimate,
              destinationTokenDecimals,
            ).toFixed()
          : undefined;
    }
  }

  const sourceAmountFormatted =
    sourceTokenAmount && sourceTokenDecimals && sourceTokenSymbol
      ? `${sourceTokenAmount} ${sourceTokenSymbol}`
      : undefined;
  const destinationAmountFormatted =
    destinationTokenAmount && status === CONFIRMED_STATUS
      ? `${destinationTokenAmount} ${destinationTokenSymbol}`
      : undefined;

  const priorityFee =
    effectiveGasPrice &&
    baseFeePerGas &&
    subtractHexes(effectiveGasPrice, baseFeePerGas);

  const hexGasTotal = calcHexGasTotal(transaction);

  const totalInHex = sumHexes(
    hexGasTotal,
    // @ts-expect-error TODO: fix this, ported directly from original code
    value,
    l1HexGasTotal ?? 0,
  );

  return {
    nativeCurrency: getNativeCurrency(state),
    showFiat: getShouldShowFiat(state),
    totalInHex,
    gas,
    gasPrice,
    maxFeePerGas,
    gasUsed,
    isTokenApprove,
    hexGasTotal,
    priorityFee,
    baseFee: baseFeePerGas,
    isEIP1559Transaction: isEIP1559Transaction(transaction),
    l1HexGasTotal,
    sourceAmountFormatted,
    destinationAmountFormatted,
  };
};
