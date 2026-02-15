import React from 'react';
import {
  AvatarTokenSize,
  AvatarToken,
  FontWeight,
  TextColor,
  TextVariant,
  Text,
} from '@metamask/design-system-react';
import type { TransactionViewModel } from '../../../../../shared/lib/multichain/types';
import { hexWEIToDecETH } from '../../../../../shared/modules/conversion.utils';
import { shortenAddress } from '../../../../helpers/utils/util';
import { useEvmTokenInfo } from '../hooks';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  DateRow,
  NetworkRow,
  Row,
  StatusRow,
  TransactionHashRow,
} from './shared';

type Props = {
  transaction: TransactionViewModel;
};

export const ApprovalDetails = ({ transaction }: Props) => {
  const { formatToken } = useFormatters();
  const t = useI18nContext();

  const { chainId, hash, time, txParams } = transaction;

  const tokenContractAddress = txParams.to;
  const { symbol: tokenSymbol, iconUrl: tokenIconUrl } = useEvmTokenInfo(
    chainId,
    tokenContractAddress,
  );
  const displayAmount = Number(hexWEIToDecETH(txParams.value ?? '0x0')); // TODO: this isn't the approval amount

  const networkFeeWei =
    txParams.gasUsed && txParams.gasPrice
      ? BigInt(txParams.gasUsed) * BigInt(txParams.gasPrice)
      : BigInt(0);
  const networkFeeEth = Number(networkFeeWei) / 10 ** 18;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          You approved
        </Text>
        <div className="flex items-center gap-3">
          <AvatarToken
            src={tokenIconUrl}
            name={tokenSymbol}
            size={AvatarTokenSize.Md}
          />
          <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Medium}>
            {tokenSymbol}
          </Text>
        </div>
      </div>

      <div className="h-px bg-border-muted" />

      <div className="flex flex-col gap-2">
        <Row left={t('account')} right={shortenAddress(txParams.from)} />
        <DateRow time={time} />
        <NetworkRow chainId={chainId} />
        <Row left={t('networkFee')} right={formatToken(networkFeeEth, 'ETH')} />
        <Row left="Approval amount" right={Math.abs(displayAmount)} />
      </div>

      <div className="h-px bg-border-muted" />

      <div className="flex flex-col gap-2">
        <StatusRow status={transaction.status} />
        <TransactionHashRow
          label="Transaction hash" // TODO: Add translation
          chainId={chainId}
          hash={hash}
        />
      </div>
    </>
  );
};
