import React from 'react';
import type { TransactionViewModel } from '../../../../../shared/lib/multichain/types';
import { shortenAddress } from '../../../../helpers/utils/util';
import { getPrimaryAmount } from '../helpers';
import { useEvmTokenIconUrl } from '../hooks';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
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

export const TransferDetails = ({ transaction }: Props) => {
  const { formatToken } = useFormatters();
  const t = useI18nContext();
  const { amount, token } = getPrimaryAmount(transaction.amounts ?? {});
  const displayAmount = amount ? Number.parseFloat(amount) : 0;

  const { chainId, hash, time, txParams } = transaction;
  const tokenIconUrl = useEvmTokenIconUrl(
    chainId,
    token?.symbol,
    transaction.transferInformation?.symbol === token?.symbol
      ? transaction.transferInformation?.contractAddress
      : undefined,
  );

  const networkFeeWei =
    txParams.gasUsed && txParams.gasPrice
      ? BigInt(txParams.gasUsed) * BigInt(txParams.gasPrice)
      : BigInt(0);
  const networkFeeEth = Number(networkFeeWei) / 10 ** 18;

  return (
    <>
      <TokenAmountBlock
        label={t('youSent')}
        iconSrc={tokenIconUrl}
        symbol={token?.symbol ?? ''}
        amount={Math.abs(displayAmount)}
        variant="sent"
      />

      <div className="h-px bg-border-muted" />

      <div className="flex flex-col gap-2">
        <StatusRow status={transaction.status} />
        <DateRow time={time} />
        <Row left={t('from')} right={shortenAddress(txParams.from)} />
        <Row left={t('to')} right={shortenAddress(txParams.to)} />
        <NetworkRow chainId={chainId} />
        <Row left={t('networkFee')} right={formatToken(networkFeeEth, 'ETH')} />
        <Row
          left="Total amount" // TODO: add translation
          right={formatToken(networkFeeEth, 'ETH')}
        />
      </div>

      <div className="h-px bg-border-muted" />
      <TransactionHashRow
        label="Transaction hash" // TODO: Add translation
        chainId={chainId}
        hash={hash}
      />
    </>
  );
};
