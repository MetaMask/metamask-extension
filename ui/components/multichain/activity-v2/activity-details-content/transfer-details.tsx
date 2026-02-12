import React from 'react';
import {
  Text,
  TextButton,
  AvatarToken,
  AvatarTokenSize,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import type { TransactionViewModel } from '../../../../../shared/acme-controller/types';
import { shortenAddress } from '../../../../helpers/utils/util';
import { getExplorerUrl, getTransferAmount } from '../helpers';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { DateRow } from './date-row';
import { NetworkRow } from './network-row';
import { Row } from './row';
import { StatusRow } from './status-row';

type Props = {
  transaction: TransactionViewModel;
};

export const TransferDetails = ({ transaction }: Props) => {
  const { formatToken } = useFormatters();
  const t = useI18nContext();
  const { amount, symbol } = getTransferAmount(transaction.amounts);
  const displayAmount = amount ? Number.parseFloat(amount) : 0;

  const { chainId, hash, time, txParams } = transaction;
  const explorerUrl = hash ? getExplorerUrl(chainId, hash) : undefined;

  const networkFeeWei =
    txParams.gasUsed && txParams.gasPrice
      ? BigInt(txParams.gasUsed) * BigInt(txParams.gasPrice)
      : BigInt(0);
  const networkFeeEth = Number(networkFeeWei) / 10 ** 18;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('youSent')}
        </Text>
        <div className="flex items-center gap-3">
          <AvatarToken src="" name={symbol} size={AvatarTokenSize.Md} />
          <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Medium}>
            {displayAmount > 0 ? '+' : ''}
            {displayAmount} {symbol}
          </Text>
        </div>
      </div>

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

      <Row
        left="Transaction hash" // TODO: add translation
        right={
          explorerUrl ? (
            <TextButton asChild>
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                {t('viewOnExplorer')}
              </a>
            </TextButton>
          ) : (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {shortenAddress(hash)}
            </Text>
          )
        }
      />
    </>
  );
};
