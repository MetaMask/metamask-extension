import React from 'react';
import {
  Text,
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  TextVariant,
  TextColor,
  FontWeight,
  TextButton,
} from '@metamask/design-system-react';
import type { TransactionViewModel } from '../../../../../shared/acme-controller/types';
import { shortenAddress } from '../../../../helpers/utils/util';
import {
  mapChainInfo,
  getExplorerUrl,
  formatDateTime,
  formatUnits,
} from '../helpers';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useActivityTokenIconBySymbol } from '../hooks';
import { Row } from './row';
import { TransactionStatus } from '@metamask/transaction-controller';

type Props = {
  transaction: TransactionViewModel;
};

export const SwapDetails = ({ transaction }: Props) => {
  console.log("swap details", transaction);
  const t = useI18nContext();
  const { formatToken } = useFormatters();

  const { chainId, hash, time, txParams } = transaction;
  const { chainImageUrl, chainName } = mapChainInfo(chainId);
  const explorerUrl = hash
    ? getExplorerUrl(chainId, hash)
    : undefined;
  const formattedDate = formatDateTime(time);

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

  const fromTokenIconUrl = useActivityTokenIconBySymbol(
    transaction.chainId,
    fromSymbol,
  );
  const toTokenIconUrl = useActivityTokenIconBySymbol(
    transaction.chainId,
    toSymbol,
  );

  const isBridge =
    transaction.transactionType === 'BRIDGE';

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* You sent */}
        <div className="flex flex-col gap-2">
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('youSent')}
          </Text>
          <div className="flex items-center gap-3">
            <AvatarToken src="" name={fromSymbol} size={AvatarTokenSize.Md} />
            <Text
              variant={TextVariant.HeadingLg}
              fontWeight={FontWeight.Medium}
            >
              -{Math.abs(fromAmount)} {fromSymbol}
            </Text>
          </div>
        </div>

        {/* You received */}
        <div className="flex flex-col gap-2">
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('youReceived')}
          </Text>{' '}
          <div className="flex items-center gap-3">
            <AvatarToken src="" name={toSymbol} size={AvatarTokenSize.Md} />
            <Text
              variant={TextVariant.HeadingLg}
              fontWeight={FontWeight.Medium}
              color={TextColor.SuccessDefault}
            >
              +{toAmount} {toSymbol}
            </Text>
          </div>
        </div>
      </div>

      <div className="h-px bg-border-muted" />

      <div className="flex flex-col gap-2">
        <Row
          left={t('status')}
          right={
            <Text
              variant={TextVariant.BodySm}
              color={
                transaction.status === TransactionStatus.confirmed
                  ? TextColor.SuccessDefault
                  : TextColor.ErrorDefault
              }
            >
              {transaction.status === TransactionStatus.confirmed
                ? t('confirmed')
                : t('failed')}
            </Text>
          }
        />
        <Row left={t('date')} right={formattedDate} />
        <Row
          left={t('network')}
          right={
            <div className="flex items-center gap-2">
              <AvatarNetwork
                name={chainName}
                src={chainImageUrl}
                size={AvatarNetworkSize.Xs}
              />
              <Text className="font-medium">{chainName}</Text>
            </div>
          }
        />
        <Row left={t('networkFee')} right={formatToken(networkFeeEth, 'ETH')} />
        <Row left="Total amount" right={<div/>} />
      </div>

      <div className="h-px bg-border-muted" />

      {isBridge ? (
        <>
          <Row
            left="Transaction hash #1"
            right={
              explorerUrl ? (
                <TextButton asChild>
                  <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                    {t('viewOnExplorer')}
                  </a>
                </TextButton>
              ) : (
                <Text className="text-xs text-text-alternative">
                  {shortenAddress(hash)}
                </Text>
              )
            }
          />
          <Row
            left="Transaction hash #2"
            right={
              explorerUrl ? (
                <TextButton asChild>
                  <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                    {t('viewOnExplorer')}
                  </a>
                </TextButton>
              ) : (
                <Text className="text-xs text-text-alternative">
                  {shortenAddress(hash)}
                </Text>
              )
            }
          />
        </>
      ) : (
        <Row
          left="Transaction hash" // Todo: add translation
          right={
            explorerUrl ? (
              <TextButton asChild>
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                  {t('viewOnExplorer')}
                </a>
              </TextButton>
            ) : (
              <Text className="text-xs text-text-alternative">
                {shortenAddress(hash)}
              </Text>
            )
          }
        />
      )}
    </>
  );
};
