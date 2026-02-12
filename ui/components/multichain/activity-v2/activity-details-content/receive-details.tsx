import React from 'react';
import type { TransactionViewModel } from '../../../../../shared/acme-controller/types';
import { shortenAddress } from '../../../../helpers/utils/util';
import { getExplorerUrl, getTransferAmount } from '../helpers';
import { useEvmTokenIconUrl } from '../hooks';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { DateRow } from './date-row';
import { NetworkRow } from './network-row';
import { Row } from './row';
import { StatusRow } from './status-row';
import { TokenAmountBlock } from './token-amount-block';
import { TransactionHashRow } from './transaction-hash-row';

type Props = {
  transaction: TransactionViewModel;
};

export const ReceiveDetails = ({ transaction }: Props) => {
  const t = useI18nContext();
  const { amount, symbol } = getTransferAmount(transaction.amounts);
  const displayAmount = amount ? Number.parseFloat(amount) : 0;

  const explorerUrl = transaction.hash
    ? getExplorerUrl(transaction.chainId, transaction.hash)
    : undefined;
  const tokenIconUrl = useEvmTokenIconUrl(
    transaction.chainId,
    symbol,
    transaction.transferInformation?.symbol === symbol
      ? transaction.transferInformation?.contractAddress
      : undefined,
  );

  const { txParams, hash } = transaction;

  return (
    <>
      <TokenAmountBlock
        label={t('youReceived')}
        iconSrc={tokenIconUrl}
        symbol={symbol ?? ''}
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
          explorerUrl={explorerUrl ?? undefined}
          hash={hash}
        />
      </div>
    </>
  );
};
