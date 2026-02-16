import React from 'react';
import type { TransactionViewModel } from '../../../../../shared/lib/multichain/types';
import { shortenAddress } from '../../../../helpers/utils/util';
import { getPrimaryAmount } from '../helpers';
import { useEvmTokenIconUrl } from '../hooks';
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

export const ReceiveDetails = ({ transaction }: Props) => {
  const t = useI18nContext();
  const { amount, token } = getPrimaryAmount(transaction.amounts ?? {});
  const displayAmount = amount ? Number.parseFloat(amount) : 0;

  const tokenIconUrl = useEvmTokenIconUrl(
    transaction.chainId,
    token?.symbol,
    transaction.transferInformation?.symbol === token?.symbol
      ? transaction.transferInformation?.contractAddress
      : undefined,
  );

  const { txParams, hash } = transaction;

  return (
    <>
      <TokenAmountBlock
        label={t('youReceived')}
        iconSrc={tokenIconUrl}
        symbol={token?.symbol ?? ''}
        amount={Math.abs(displayAmount)}
        variant="received"
      />

      <div className="h-px bg-border-muted" />

      <div className="flex flex-col gap-2">
        <Row left={t('from')} right={shortenAddress(txParams.from)} />
        <DateRow time={transaction.time} />
        <NetworkRow chainId={transaction.chainId} />
      </div>

      <div className="h-px bg-border-muted" />

      <div className="flex flex-col gap-2">
        <StatusRow status={transaction.status} />
        <TransactionHashRow
          label="Transaction hash" // TODO: Add translation
          chainId={transaction.chainId}
          hash={hash}
        />
      </div>
    </>
  );
};
