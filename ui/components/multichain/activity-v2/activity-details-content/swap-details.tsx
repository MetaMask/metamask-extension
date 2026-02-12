import React from 'react';
import { Text, TextButton, TextVariant, TextColor } from '@metamask/design-system-react';
import type { TransactionViewModel } from '../../../../../shared/acme-controller/types';
import { shortenAddress } from '../../../../helpers/utils/util';
import { getExplorerUrl, formatUnits } from '../helpers';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useEvmTokenIconUrl } from '../hooks';
import {
  DateRow,
  NetworkRow,
  Row,
  StatusRow,
  TokenAmountBlock,
  TransactionHashRow,
} from './shared';

type Props = {
  transaction: TransactionViewModel;
};

export const SwapDetails = ({ transaction }: Props) => {
  const t = useI18nContext();
  const { formatToken } = useFormatters();

  const { chainId, hash, time, txParams } = transaction;
  const explorerUrl = hash ? getExplorerUrl(chainId, hash) : undefined;

  const networkFeeWei =
    txParams.gasUsed && txParams.gasPrice
      ? BigInt(txParams.gasUsed) * BigInt(txParams.gasPrice)
      : BigInt(0);
  const networkFeeEth = Number(networkFeeWei) / 10 ** 18;

  // Extract amounts for swap/bridge
  const fromData = transaction.amounts?.from;
  const toData = transaction.amounts?.to;

  const fromAmount =
    fromData?.amount && fromData?.decimal !== undefined
      ? parseFloat(formatUnits(BigInt(fromData.amount), fromData.decimal))
      : 0;
  const fromSymbol = fromData?.symbol || '';

  const toAmount =
    toData?.amount && toData?.decimal !== undefined
      ? parseFloat(formatUnits(BigInt(toData.amount), toData.decimal))
      : 0;
  const toSymbol = toData?.symbol || '';

  const fromIcon = useEvmTokenIconUrl(chainId, fromSymbol);
  const toIcon = useEvmTokenIconUrl(chainId, toSymbol);
  const isBridge = transaction.transactionType === 'BRIDGE';

  return (
    <>
      <div className="flex flex-col gap-4">
        <TokenAmountBlock
          label={t('youSent')}
          iconSrc={fromIcon}
          symbol={fromSymbol}
          amount={fromAmount}
          variant="sent"
        />
        <TokenAmountBlock
          label={t('youReceived')}
          iconSrc={toIcon}
          symbol={toSymbol}
          amount={toAmount}
          variant="received"
        />
      </div>

      <div className="h-px bg-border-muted" />

      <div className="flex flex-col gap-2">
        <StatusRow status={transaction.status} />
        <DateRow time={time} />
        <Row left={t('account')} right={shortenAddress(txParams.from)} />
        <NetworkRow chainId={chainId} />
        <Row left={t('networkFee')} right={formatToken(networkFeeEth, 'ETH')} />
        <Row left="Total amount" right={<div />} />
      </div>

      <div className="h-px bg-border-muted" />

      {isBridge ? (
        <>
          <TransactionHashRow
            label="Transaction hash #1" // TODO: Add translation
            explorerUrl={explorerUrl ?? undefined}
            hash={hash

            }
          />
          <TransactionHashRow
            label="Transaction hash #2" // TODO: Add translation
            explorerUrl={explorerUrl ?? undefined}
            hash={hash}
          />
        </>
      ) : (
        <TransactionHashRow
          label="Transaction hash" // TODO: Add translation
          explorerUrl={explorerUrl ?? undefined}
          hash={hash}
        />
      )}
    </>
  );
};
