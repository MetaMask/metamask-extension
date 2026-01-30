/* eslint-disable @typescript-eslint/naming-convention */
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
import { getTransactions } from '../../../../../selectors/transactions';
import { getTokenByAccountAndAddressAndChainId } from '../../../../../selectors/assets';
import { selectNetworkConfigurationByChainId } from '../../../../../selectors';
import { BlockExplorerLink } from '../block-explorer-link';
import { TransactionStatusIcon } from '../transaction-status-icon';

type TranslateFunction = (key: string, args?: string[]) => string;

export function TransactionDetailsSummary() {
  const t = useI18nContext() as TranslateFunction;
  const { transactionMeta } = useTransactionDetails();
  const allTransactions = useSelector(getTransactions);
  const { requiredTransactionIds, metamaskPay } = transactionMeta;

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

  const transactions = useMemo(() => {
    return [...requiredTransactions, transactionMeta];
  }, [requiredTransactions, transactionMeta]);

  const payTokenAddress = metamaskPay?.tokenAddress as Hex | undefined;

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
        paddingLeft={2}
      >
        {transactions.map((tx, index) => (
          <TransactionSummaryLine
            key={tx.id}
            transactionMeta={tx}
            payTokenAddress={payTokenAddress}
            isLast={index === transactions.length - 1}
          />
        ))}
      </Box>
    </Box>
  );
}

function TransactionSummaryLine({
  transactionMeta,
  payTokenAddress,
  isLast,
}: {
  transactionMeta: TransactionMeta;
  payTokenAddress: Hex | undefined;
  isLast: boolean;
}) {
  const { type } = transactionMeta;

  if (type === TransactionType.relayDeposit) {
    return (
      <RelayDepositSummaryLine
        transactionMeta={transactionMeta}
        tokenAddress={payTokenAddress}
      />
    );
  }

  if (
    type === TransactionType.musdConversion ||
    type === TransactionType.perpsDeposit
  ) {
    return (
      <ReceiveSummaryLine transactionMeta={transactionMeta} isLast={isLast} />
    );
  }

  return (
    <DefaultSummaryLine transactionMeta={transactionMeta} isLast={isLast} />
  );
}

function RelayDepositSummaryLine({
  transactionMeta,
  tokenAddress,
}: {
  transactionMeta: TransactionMeta;
  tokenAddress: Hex | undefined;
}) {
  const t = useI18nContext() as TranslateFunction;
  const { chainId } = transactionMeta;

  const token = useSelector((state) =>
    tokenAddress && chainId
      ? getTokenByAccountAndAddressAndChainId(
          state,
          undefined,
          tokenAddress,
          chainId,
        )
      : null,
  );

  const networkConfig = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  const tokenSymbol = token?.symbol;
  const networkName = networkConfig?.name;

  const title =
    tokenSymbol && networkName
      ? t('bridgeSend', [tokenSymbol, networkName])
      : t('bridgeSendLoading');

  return (
    <SummaryLine
      chainId={chainId}
      hash={transactionMeta.hash}
      status={transactionMeta.status}
      time={transactionMeta.submittedTime ?? transactionMeta.time}
      title={title}
      isLast={false}
    />
  );
}

const HYPERLIQUID_NETWORK_NAME = 'Hyperliquid';

function ReceiveSummaryLine({
  transactionMeta,
  isLast,
}: {
  transactionMeta: TransactionMeta;
  isLast: boolean;
}) {
  const t = useI18nContext() as TranslateFunction;
  const { type, chainId, txParams } = transactionMeta;
  const isPerpsDeposit = type === TransactionType.perpsDeposit;

  const targetTokenAddress = txParams?.to as Hex | undefined;

  const token = useSelector((state) =>
    targetTokenAddress && chainId
      ? getTokenByAccountAndAddressAndChainId(
          state,
          undefined,
          targetTokenAddress,
          chainId,
        )
      : null,
  );

  const networkConfig = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  const tokenSymbol = token?.symbol;

  let networkName: string | undefined;
  if (isPerpsDeposit) {
    networkName = HYPERLIQUID_NETWORK_NAME;
  } else {
    networkName = networkConfig?.name;
  }

  const title =
    tokenSymbol && networkName
      ? t('bridgeReceive', [tokenSymbol, networkName])
      : t('bridgeReceiveLoading');

  return (
    <SummaryLine
      chainId={chainId}
      hash={transactionMeta.hash}
      isHyperliquid={isPerpsDeposit}
      status={transactionMeta.status}
      time={transactionMeta.submittedTime ?? transactionMeta.time}
      title={title}
      isLast={isLast}
    />
  );
}

function DefaultSummaryLine({
  transactionMeta,
  isLast,
}: {
  transactionMeta: TransactionMeta;
  isLast: boolean;
}) {
  const t = useI18nContext() as TranslateFunction;
  const { type, chainId } = transactionMeta;

  let title: string;
  switch (type) {
    case TransactionType.bridge:
      title = t('bridge');
      break;
    case TransactionType.bridgeApproval:
      title = t('bridgeApproval');
      break;
    case TransactionType.swap:
      title = t('swap');
      break;
    case TransactionType.swapApproval:
      title = t('swapApproval');
      break;
    default:
      title = t('transaction');
  }

  return (
    <SummaryLine
      chainId={chainId}
      hash={transactionMeta.hash}
      status={transactionMeta.status}
      time={transactionMeta.submittedTime ?? transactionMeta.time}
      title={title}
      isLast={isLast}
    />
  );
}

function SummaryLine({
  chainId,
  hash,
  isHyperliquid = false,
  isLast,
  status,
  time,
  title,
}: {
  chainId: Hex;
  hash: string | undefined;
  isHyperliquid?: boolean;
  isLast: boolean;
  status: TransactionStatus;
  time: number;
  title: string;
}) {
  const { time: timeString, date } = formatTransactionDateTime(time);

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          gap={2}
        >
          <TransactionStatusIcon status={status} />
          <Text variant={TextVariant.bodyMdMedium}>{title}</Text>
        </Box>
        <BlockExplorerLink
          chainId={chainId}
          hash={hash}
          isHyperliquid={isHyperliquid}
        />
      </Box>
      <Box display={Display.Flex} flexDirection={FlexDirection.Row}>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          style={{ width: '16px' }}
        >
          {!isLast && (
            <Box
              backgroundColor={BackgroundColor.iconAlternative}
              style={{
                width: '2px',
                minHeight: '16px',
              }}
            />
          )}
        </Box>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          paddingLeft={2}
          paddingBottom={isLast ? 0 : 2}
        >
          {timeString} • {date}
        </Text>
      </Box>
    </Box>
  );
}
