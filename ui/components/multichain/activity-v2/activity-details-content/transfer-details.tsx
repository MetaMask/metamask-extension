import React from 'react';
import {
  Text,
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import type { TransactionViewModel } from '../../../../../shared/acme-controller/types';
import { shortenAddress } from '../../../../helpers/utils/util';
import {
  extractAmountAndSymbol,
  mapChainInfo,
  getExplorerUrl,
  formatDateTime,
} from '../helpers';
import { Row } from './row';

type Props = {
  transaction: TransactionViewModel;
  formatToken: (amount: number, symbol: string) => string;
  selectedAddress?: string;
  nativeCurrency?: string;
};

export const TransferDetails = ({
  transaction,
  formatToken,
  selectedAddress,
  nativeCurrency,
}: Props) => {
  const { amount, symbol } = extractAmountAndSymbol(
    transaction,
    selectedAddress,
    nativeCurrency,
  );
  const { chainImageUrl, chainName } = mapChainInfo(transaction.chainId);
  const explorerUrl = getExplorerUrl(transaction.chainId, transaction.hash);
  const formattedDate = formatDateTime(transaction.timestamp);

  const networkFeeWei =
    transaction.gasUsed && transaction.effectiveGasPrice
      ? BigInt(transaction.gasUsed) * BigInt(transaction.effectiveGasPrice)
      : BigInt(0);
  const networkFeeEth = Number(networkFeeWei) / 10 ** 18;
  const { from, to, hash, isError } = transaction;

  const status = isError ? 'Failed' : 'Confirmed';
  const statusColor = isError ? 'text-error-default' : 'text-success-default';

  return (
    <>
      {/* Amount Section */}
      <div className="flex flex-col gap-2">
        <Text className="text-text-alternative text-sm">You sent</Text>
        <div className="flex items-center gap-3">
          <AvatarToken src="" name={symbol} size={AvatarTokenSize.Md} />
          <Text className="text-2xl font-medium">
            {amount > 0 ? '+' : ''}
            {amount} {symbol}
          </Text>
        </div>
      </div>

      <div className="h-px bg-border-muted" />

      <Row left="From" right={shortenAddress(from)} />
      <Row left="To" right={shortenAddress(to)} />
      <Row left="Date" right={formattedDate} />

      <Row
        left="Network"
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

      <Row left="Network fee" right={formatToken(networkFeeEth, 'ETH')} />

      <div className="h-px bg-border-muted" />

      <Row
        left="Status"
        right={<Text className={statusColor}>{status}</Text>}
      />

      <Row
        left="Transaction hash"
        right={
          explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-default hover:text-primary-default-hover"
            >
              View on Explorer ↗
            </a>
          ) : (
            <Text className="text-xs text-text-alternative">
              {shortenAddress(hash)}
            </Text>
          )
        }
      />
    </>
  );
};
