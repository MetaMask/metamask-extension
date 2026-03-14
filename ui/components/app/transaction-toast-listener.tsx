import React, { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  TransactionStatus as KeyringTransactionStatus,
  type Transaction as KeyringTransaction,
} from '@metamask/keyring-api';
import { isHexString } from '@metamask/utils';
import { toast } from 'react-hot-toast';
import {
  getNonEvmToastTransactions,
  getPendingNonEvmToastTransactions,
  getToastTransactions,
} from '../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../shared/lib/selectors/networks';
import { shortenAddress } from '../../helpers/utils/util';
import {
  ERC20_TRANSFER_SELECTOR,
  TRANSACTION_FAILED_STATUSES,
  TRANSACTION_PENDING_STATUSES,
  TRANSACTION_SUCCESS_STATUSES,
} from '../../helpers/constants/transactions';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import {
  getEthConversionFromWeiHex,
  hexToDecimal,
} from '../../../shared/lib/conversion.utils';

type TransactionLike = Pick<
  TransactionMeta,
  | 'id'
  | 'status'
  | 'type'
  | 'chainId'
  | 'txParams'
  | 'sourceTokenSymbol'
  | 'destinationTokenSymbol'
  | 'swapMetaData'
> & {
  gasFeeTokens?: {
    tokenAddress?: string;
    symbol?: string;
    decimals?: number;
  }[];
  err?: {
    message?: string;
  };
};

type DescriptionVariant = 'pending' | 'success' | 'failed';

type NonEvmTransactionLike = Pick<
  KeyringTransaction,
  'id' | 'status' | 'type' | 'to' | 'from' | 'chain' | 'account'
>;

function isZeroHexValue(value: unknown): boolean {
  return (
    typeof value === 'string' && isHexString(value) && /^0x0+$/iu.test(value)
  );
}

function hexToDecimalSafe(value: string): string | undefined {
  if (!isHexString(value)) {
    return undefined;
  }

  return hexToDecimal(value);
}

function parseErc20TransferData(data: unknown):
  | {
      recipient: string;
      amountHex: string;
    }
  | undefined {
  if (typeof data !== 'string' || !isHexString(data)) {
    return undefined;
  }

  const unprefixedData = data.slice(2);
  if (
    unprefixedData.length < 136 ||
    unprefixedData.slice(0, 8).toLowerCase() !== ERC20_TRANSFER_SELECTOR
  ) {
    return undefined;
  }

  const recipientWord = unprefixedData.slice(8, 72);
  const amountWord = unprefixedData.slice(72, 136);

  return {
    recipient: `0x${recipientWord.slice(24)}`,
    amountHex: `0x${amountWord}`,
  };
}

function getTransferTokenMetadata(tx: TransactionLike) {
  const tokenAddress =
    typeof tx?.txParams?.to === 'string' ? tx.txParams.to.toLowerCase() : null;

  if (!tokenAddress || !Array.isArray(tx.gasFeeTokens)) {
    return undefined;
  }

  return tx.gasFeeTokens.find(
    (token) =>
      typeof token?.tokenAddress === 'string' &&
      token.tokenAddress.toLowerCase() === tokenAddress,
  );
}

function generateDescription(
  tx: TransactionLike,
  variant: DescriptionVariant = 'pending',
  nativeCurrencySymbol?: string,
) {
  if (
    tx.type === TransactionType.swap ||
    tx.type === TransactionType.swapAndSend
  ) {
    const sourceTokenSymbol =
      tx.sourceTokenSymbol ??
      (typeof tx.swapMetaData?.token_from === 'string'
        ? tx.swapMetaData.token_from
        : undefined) ??
      (typeof tx.swapMetaData?.sourceTokenSymbol === 'string'
        ? tx.swapMetaData.sourceTokenSymbol
        : undefined);

    const destinationTokenSymbol =
      tx.destinationTokenSymbol ??
      (typeof tx.swapMetaData?.token_to === 'string'
        ? tx.swapMetaData.token_to
        : undefined) ??
      (typeof tx.swapMetaData?.destinationTokenSymbol === 'string'
        ? tx.swapMetaData.destinationTokenSymbol
        : undefined);

    if (sourceTokenSymbol && destinationTokenSymbol) {
      return `Swap ${sourceTokenSymbol} to ${destinationTokenSymbol}`;
    }

    return 'Swap';
  }

  const defaultRecipient =
    typeof tx?.txParams?.to === 'string' ? tx.txParams.to : undefined;
  const valueHex = tx?.txParams?.value;
  const actionText = variant === 'success' ? 'sent to' : 'sending to';

  // Parse calldata only for transfer (send) transactions.
  if (tx.type === TransactionType.tokenMethodTransfer) {
    const parsedTransferData = parseErc20TransferData(tx?.txParams?.data);

    if (parsedTransferData) {
      const transferTokenMetadata = getTransferTokenMetadata(tx);

      const decimals = transferTokenMetadata?.decimals;
      const transferAmountBaseUnits = hexToDecimalSafe(
        parsedTransferData.amountHex,
      );
      const hasValidDecimals =
        typeof decimals === 'number' &&
        Number.isInteger(decimals) &&
        decimals >= 0;

      if (hasValidDecimals && transferAmountBaseUnits) {
        const transferAmount = calcTokenAmount(
          transferAmountBaseUnits,
          decimals,
        ).toString(10);

        const amountPart = transferTokenMetadata?.symbol
          ? `${transferAmount} ${transferTokenMetadata.symbol}`
          : transferAmount;

        return `${amountPart} ${actionText} ${shortenAddress(parsedTransferData.recipient)}`;
      }

      return `${actionText} ${shortenAddress(parsedTransferData.recipient)}`;
    }
  }

  const baseAmountPart =
    typeof valueHex === 'string' &&
    isHexString(valueHex) &&
    !isZeroHexValue(valueHex)
      ? getEthConversionFromWeiHex({
          value: valueHex,
          numberOfDecimals: 6,
        })
      : undefined;

  const amountPart =
    baseAmountPart && nativeCurrencySymbol && nativeCurrencySymbol !== 'ETH'
      ? baseAmountPart.replace(/ ETH$/u, ` ${nativeCurrencySymbol}`)
      : baseAmountPart;

  const recipientPart = defaultRecipient
    ? `${actionText} ${shortenAddress(defaultRecipient)}`
    : undefined;

  if (amountPart && recipientPart) {
    return `${amountPart} ${recipientPart}`;
  }

  return amountPart ?? recipientPart ?? 'View details for transaction';
}

function generateNonEvmDescription(
  tx: NonEvmTransactionLike,
  variant: DescriptionVariant = 'pending',
) {
  const actionText = variant === 'success' ? 'sent to' : 'sending to';
  const primaryTo = tx.to?.[0];
  const amount =
    primaryTo?.asset && 'amount' in primaryTo.asset
      ? primaryTo.asset.amount
      : undefined;
  const unit =
    primaryTo?.asset && 'unit' in primaryTo.asset
      ? primaryTo.asset.unit
      : undefined;
  const toAddress = primaryTo?.address;

  let amountPart: string | undefined;
  if (amount) {
    amountPart = unit ? `${amount} ${unit}` : amount;
  }

  const recipientPart = toAddress
    ? `${actionText} ${shortenAddress(toAddress)}`
    : undefined;

  if (amountPart && recipientPart) {
    return `${amountPart} ${recipientPart}`;
  }

  return amountPart ?? recipientPart ?? 'View details for transaction';
}

const isPendingStatus = (status: string) =>
  TRANSACTION_PENDING_STATUSES.some(
    (pendingStatus) => pendingStatus === status,
  );
const isSuccessStatus = (status: string) =>
  TRANSACTION_SUCCESS_STATUSES.some(
    (successStatus) => successStatus === status,
  );
const isFailedStatus = (status: string) =>
  TRANSACTION_FAILED_STATUSES.some((failedStatus) => failedStatus === status);

const isNonEvmSuccessStatus = (status: string) =>
  status === KeyringTransactionStatus.Confirmed;

const isNonEvmFailedStatus = (status: string) =>
  status === KeyringTransactionStatus.Failed;

export function TransactionToastListener() {
  const transactions = useSelector(getToastTransactions);
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const nonEvmTransactions = useSelector(getNonEvmToastTransactions);
  const pendingNonEvmTransactions = useSelector(
    getPendingNonEvmToastTransactions,
  );
  const prevTransactionsRef = useRef<readonly TransactionLike[]>([]);
  const prevNonEvmTransactionsRef = useRef<readonly NonEvmTransactionLike[]>(
    [],
  );
  const prevPendingNonEvmIdsRef = useRef<Set<string>>(new Set());
  const transactionList = transactions as readonly TransactionLike[];
  const nonEvmTransactionList = useMemo(
    () => (nonEvmTransactions as NonEvmTransactionLike[]) ?? [],
    [nonEvmTransactions],
  );
  const pendingNonEvmTransactionList = useMemo(
    () => (pendingNonEvmTransactions as NonEvmTransactionLike[]) ?? [],
    [pendingNonEvmTransactions],
  );

  useEffect(() => {
    const prevTransactions = prevTransactionsRef.current;
    const prevNonEvmTransactions = prevNonEvmTransactionsRef.current;
    const isFirstEvmRun = prevTransactions.length === 0;
    const isFirstNonEvmRun = prevNonEvmTransactions.length === 0;

    transactionList.forEach((tx) => {
      if (isFirstEvmRun) {
        return;
      }

      const prevTx = prevTransactions.find((ptx) => ptx.id === tx.id);

      const becamePending =
        isPendingStatus(tx.status) &&
        (!prevTx || !isPendingStatus(prevTx.status));

      const becameSuccess =
        Boolean(prevTx) &&
        isSuccessStatus(tx.status) &&
        !isSuccessStatus(prevTx?.status ?? '');

      const becameFailed =
        Boolean(prevTx) &&
        isFailedStatus(tx.status) &&
        !isFailedStatus(prevTx?.status ?? '');

      if (!becamePending && !becameSuccess && !becameFailed) {
        return;
      }

      const toastId = `tx-${tx.id}`;
      const nativeCurrencySymbol = tx.chainId
        ? networkConfigurationsByChainId?.[tx.chainId]?.nativeCurrency
        : undefined;

      if (becamePending) {
        toast.loading(
          <div>
            <p className="text-m-body-md">Transaction submitted</p>
            <p className="text-s-body-sm text-alternative">
              {generateDescription(tx, 'pending', nativeCurrencySymbol)}
            </p>
          </div>,
          { id: toastId },
        );

        return;
      }

      if (becameSuccess) {
        toast.success(
          <div>
            <p className="text-m-body-md">Transaction confirmed</p>
            <p className="text-s-body-sm text-alternative">
              {generateDescription(tx, 'success', nativeCurrencySymbol)}
            </p>
          </div>,
          { id: toastId },
        );
        return;
      }

      if (becameFailed) {
        toast.error(
          <div>
            <p className="text-m-body-md">Transaction failed</p>
            <p className="text-s-body-sm text-alternative">
              {generateDescription(tx, 'failed', nativeCurrencySymbol)}
            </p>
          </div>,
          { id: toastId },
        );
      }
    });

    const prevPendingNonEvmIds = prevPendingNonEvmIdsRef.current;
    const currentPendingNonEvmIds = new Set(
      pendingNonEvmTransactionList.map((tx) => tx.id),
    );

    pendingNonEvmTransactionList.forEach((tx) => {
      if (prevPendingNonEvmIds.has(tx.id)) {
        return;
      }

      const toastId = `non-evm-tx-${tx.id}`;

      toast.loading(
        <div>
          <p className="text-m-body-md">Transaction submitted</p>
          <p className="text-s-body-sm text-alternative">
            {generateNonEvmDescription(tx, 'pending')}
          </p>
        </div>,
        { id: toastId },
      );
    });

    nonEvmTransactionList.forEach((tx) => {
      const prevTx = prevNonEvmTransactions.find((ptx) => ptx.id === tx.id);

      const becameSuccess =
        !isFirstNonEvmRun &&
        isNonEvmSuccessStatus(tx.status) &&
        !isNonEvmSuccessStatus(prevTx?.status ?? '');

      const becameFailed =
        !isFirstNonEvmRun &&
        isNonEvmFailedStatus(tx.status) &&
        !isNonEvmFailedStatus(prevTx?.status ?? '');

      if (!becameSuccess && !becameFailed) {
        return;
      }

      const toastId = `non-evm-tx-${tx.id}`;

      if (becameSuccess) {
        toast.dismiss('non-evm-pending-fallback');

        toast.success(
          <div>
            <p className="text-m-body-md">Transaction confirmed</p>
            <p className="text-s-body-sm text-alternative">
              {generateNonEvmDescription(tx, 'success')}
            </p>
          </div>,
          { id: toastId },
        );
        return;
      }

      if (becameFailed) {
        toast.dismiss('non-evm-pending-fallback');

        toast.error(
          <div>
            <p className="text-m-body-md">Transaction failed</p>
            <p className="text-s-body-sm text-alternative">
              {generateNonEvmDescription(tx, 'failed')}
            </p>
          </div>,
          { id: toastId },
        );
      }
    });

    prevTransactionsRef.current = transactionList;
    prevNonEvmTransactionsRef.current = nonEvmTransactionList;
    prevPendingNonEvmIdsRef.current = currentPendingNonEvmIds;
  }, [
    networkConfigurationsByChainId,
    transactionList,
    nonEvmTransactionList,
    pendingNonEvmTransactionList,
  ]);

  return null;
}
