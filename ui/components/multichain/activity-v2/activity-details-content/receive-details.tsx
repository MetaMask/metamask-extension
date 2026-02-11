import React from 'react';
import {
  Text,
  AvatarToken,
  AvatarTokenSize,
  TextVariant,
  FontWeight,
  TextColor,
  TextButton,
} from '@metamask/design-system-react';
import type { TransactionViewModel } from '../../../../../shared/acme-controller/types';
import { shortenAddress } from '../../../../helpers/utils/util';
import {
  getExplorerUrl,
  getTransferAmount,
} from '../helpers';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { DateRow } from './date-row';
import { NetworkRow } from './network-row';
import { Row } from './row';
import { StatusRow } from './status-row';

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

  const { txParams, hash } = transaction;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('youReceived')}
        </Text>
        <div className="flex items-center gap-3">
          <AvatarToken
            src=""
            name={symbol}
            size={AvatarTokenSize.Md}
          />
          <Text
            variant={TextVariant.HeadingLg}
            fontWeight={FontWeight.Medium}
            color={TextColor.SuccessDefault}
          >
            {displayAmount > 0 ? '+' : ''}
            {displayAmount} {symbol}
          </Text>
        </div>
      </div>

      <div className="h-px bg-border-muted" />

      <div className="flex flex-col gap-2">
        <Row left={t('from')} right={shortenAddress(txParams.from)} />
        <DateRow time={transaction.time} />
        <NetworkRow chainId={transaction.chainId} />
      </div>

      <div className="h-px bg-border-muted" />

      <div className="flex flex-col gap-2">
        <StatusRow status={transaction.status} />

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
      </div>
    </>
  );
};
