import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { Box, Text } from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTransactionDetails } from '../transaction-details-context';
import { formatTransactionDateTime } from '../utils';
import { EXAMPLE_CUSTOM_AMOUNT_TRANSACTION_TYPE } from '../../../../../../shared/constants/transaction';
import { getTransactions } from '../../../../../selectors/transactions';
import { getNetworkNameByChainId } from '../../../../swaps/swaps.util';
import { getTokenByAccountAndAddressAndChainId } from '../../../../../selectors/assets';
import { BlockExplorerLink } from '../block-explorer-link';
import { TransactionStatusIcon } from '../transaction-status-icon';

type TranslateFunction = (key: string, args?: string[]) => string;

type SummaryLineData = {
  chainId: Hex;
  hash: string | undefined;
  status: TransactionStatus;
  time: number;
  title: string;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsSummary() {
  const t = useI18nContext() as TranslateFunction;
  const { transactionMeta } = useTransactionDetails();
  const allTransactions = useSelector(getTransactions);

  const { requiredTransactionIds, metamaskPay, chainId, txParams } =
    transactionMeta;
  const isExampleType =
    transactionMeta.type === EXAMPLE_CUSTOM_AMOUNT_TRANSACTION_TYPE;
  const hasRequiredTransactions =
    requiredTransactionIds && requiredTransactionIds.length > 0;

  const requiredTransactions = useMemo(() => {
    if (!hasRequiredTransactions) {
      return [];
    }
    return requiredTransactionIds
      .map((id) =>
        (allTransactions as TransactionMeta[]).find((tx) => tx.id === id),
      )
      .filter((tx): tx is TransactionMeta => tx !== undefined);
  }, [hasRequiredTransactions, requiredTransactionIds, allTransactions]);

  const relayDepositTransaction = requiredTransactions.find(
    (tx) => tx.type === TransactionType.relayDeposit,
  );

  const relayDepositTokenAddress = metamaskPay?.tokenAddress as Hex | undefined;
  const relayDepositChainId = relayDepositTransaction?.chainId;

  const relayDepositToken = useSelector((state) =>
    relayDepositTokenAddress && relayDepositChainId
      ? getTokenByAccountAndAddressAndChainId(
          state,
          undefined,
          relayDepositTokenAddress,
          relayDepositChainId,
        )
      : null,
  );

  const targetTokenAddress = txParams?.to as Hex | undefined;
  const targetToken = useSelector((state) =>
    targetTokenAddress && chainId
      ? getTokenByAccountAndAddressAndChainId(
          state,
          undefined,
          targetTokenAddress,
          chainId,
        )
      : null,
  );

  const lines = useMemo(() => {
    if (!hasRequiredTransactions) {
      return [
        {
          chainId,
          hash: transactionMeta.hash,
          status: transactionMeta.status,
          time: transactionMeta.submittedTime ?? transactionMeta.time,
          title: getLineTitle(transactionMeta, t),
        },
      ];
    }

    const result: SummaryLineData[] = requiredTransactions.map((tx) => ({
      chainId: tx.chainId,
      hash: tx.hash,
      status: tx.status,
      time: tx.submittedTime ?? tx.time,
      title: getLineTitleForRequiredTransaction(
        tx,
        relayDepositToken?.symbol,
        t,
      ),
    }));

    if (isExampleType) {
      const targetSymbol = targetToken?.symbol;
      const targetNetworkName = getNetworkNameByChainId(chainId);

      result.push({
        chainId,
        hash: transactionMeta.hash,
        status: transactionMeta.status,
        time: transactionMeta.submittedTime ?? transactionMeta.time,
        title:
          targetSymbol && targetNetworkName
            ? t('bridgeReceive', [targetSymbol, targetNetworkName])
            : t('bridgeReceiveLoading'),
      });
    } else {
      result.push({
        chainId,
        hash: transactionMeta.hash,
        status: transactionMeta.status,
        time: transactionMeta.submittedTime ?? transactionMeta.time,
        title: getLineTitle(transactionMeta, t),
      });
    }

    return result;
  }, [
    hasRequiredTransactions,
    transactionMeta,
    requiredTransactions,
    relayDepositToken?.symbol,
    targetToken?.symbol,
    chainId,
    isExampleType,
    t,
  ]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={3}
      data-testid="transaction-details-summary"
    >
      <Text color={TextColor.textAlternative}>{t('summary')}</Text>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={1}
        paddingLeft={2}
      >
        {lines.map((line, index) => (
          <SummaryLine
            key={index}
            chainId={line.chainId}
            hash={line.hash}
            status={line.status}
            time={line.time}
            title={line.title}
            isLast={index === lines.length - 1}
          />
        ))}
      </Box>
    </Box>
  );
}

function getLineTitleForRequiredTransaction(
  transactionMeta: TransactionMeta,
  tokenSymbol: string | undefined,
  t: TranslateFunction,
): string {
  const { type, chainId } = transactionMeta;

  if (type === TransactionType.relayDeposit) {
    const networkName = getNetworkNameByChainId(chainId);

    if (tokenSymbol && networkName) {
      return t('bridgeSend', [tokenSymbol, networkName]);
    }

    return t('bridgeSendLoading');
  }

  return getLineTitle(transactionMeta, t);
}

function getLineTitle(
  transactionMeta: TransactionMeta,
  t: TranslateFunction,
): string {
  const { type } = transactionMeta;

  switch (type) {
    case TransactionType.bridge:
      return t('bridge');
    case TransactionType.bridgeApproval:
      return t('bridgeApproval');
    case TransactionType.swap:
      return t('swap');
    case TransactionType.swapApproval:
      return t('swapApproval');
    default:
      return t('transaction');
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function SummaryLine({
  chainId,
  hash,
  isLast,
  status,
  time,
  title,
}: {
  chainId: Hex;
  hash: string | undefined;
  isLast: boolean;
  status: TransactionStatus;
  time: number;
  title: string;
}) {
  const { time: timeString, date } = formatTransactionDateTime(time);

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Row}>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        style={{ width: '20px' }}
      >
        <TransactionStatusIcon status={status} />
        {!isLast && (
          <Box
            backgroundColor={BackgroundColor.iconAlternative}
            style={{
              width: '2px',
              flex: 1,
              minHeight: '16px',
              marginTop: '4px',
              marginBottom: '4px',
            }}
          />
        )}
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        paddingLeft={2}
        style={{ flex: 1 }}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
        >
          <Text variant={TextVariant.bodyMdMedium}>{title}</Text>
          <BlockExplorerLink chainId={chainId} hash={hash} />
        </Box>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          paddingBottom={isLast ? 0 : 2}
        >
          {timeString} • {date}
        </Text>
      </Box>
    </Box>
  );
}
