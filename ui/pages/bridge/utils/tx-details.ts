import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { CaipChainId } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import type { EvmNetworkConfiguration } from '@metamask/multichain-network-controller';
import { StatusTypes } from '@metamask/bridge-controller';
import { type BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { MINUTE } from '../../../../shared/constants/time';
import { TextColor } from '../../../helpers/constants/design-system';
import { formatAmount } from '../../confirmations/components/simulation-details/formatAmount';

export type ChainInfo =
  | EvmNetworkConfiguration
  | {
      isEvm: false;
      blockExplorerUrl: string;
      chainId: CaipChainId;
      name: string;
      nativeCurrency: string;
    };

const getBlockExploreTxUrl = (
  blockExplorerUrl: string | undefined,
  txHash: string | undefined,
) => {
  if (blockExplorerUrl && txHash) {
    return `${blockExplorerUrl}/tx/${txHash}`;
  }

  return undefined;
};
export const getBlockExplorerUrl = (chainInfo?: ChainInfo, txHash?: string) => {
  if (!chainInfo || !txHash) {
    return undefined;
  }
  if (!chainInfo.isEvm) {
    return getBlockExploreTxUrl(chainInfo.blockExplorerUrl, txHash);
  }

  const index = chainInfo.defaultBlockExplorerUrlIndex;
  if (index === undefined) {
    return undefined;
  }

  const rootUrl = chainInfo.blockExplorerUrls[index]?.replace(/\/$/u, '');
  return getBlockExploreTxUrl(rootUrl, txHash);
};

export const getBridgeAmountSentFormatted = ({
  bridgeHistoryItem,
  txMeta,
}: {
  bridgeHistoryItem?: BridgeHistoryItem;
  txMeta?: TransactionMeta;
}) => {
  if (!txMeta) {
    return undefined;
  }

  const sentAmount = bridgeHistoryItem?.pricingData?.amountSent;
  const srcAssetDecimals = bridgeHistoryItem?.quote.srcAsset.decimals;
  if (!sentAmount || !srcAssetDecimals) {
    return undefined;
  }
  return sentAmount;
};

export const getBridgeAmountReceivedFormatted = ({
  locale,
  bridgeHistoryItem,
  txMeta,
}: {
  locale: string;
  bridgeHistoryItem?: BridgeHistoryItem;
  txMeta?: TransactionMeta;
}) => {
  if (!txMeta) {
    return undefined;
  }

  const isTxComplete =
    txMeta.type === TransactionType.bridge && bridgeHistoryItem
      ? bridgeHistoryItem.status.status === StatusTypes.COMPLETE
      : txMeta.status === TransactionStatus.confirmed;

  if (!isTxComplete) {
    return undefined;
  }

  const destAmount =
    txMeta.swapMetaData?.token_to_amount ??
    bridgeHistoryItem?.status.destChain?.amount ??
    bridgeHistoryItem?.quote.destTokenAmount;
  const destAssetDecimals =
    txMeta.swapMetaData?.token_to_decimals ??
    txMeta.destinationTokenDecimals ??
    bridgeHistoryItem?.quote.destAsset.decimals;
  if (!destAmount || !destAssetDecimals) {
    return undefined;
  }
  return formatAmount(
    locale,
    new BigNumber(destAmount).dividedBy(10 ** destAssetDecimals),
  );
};

/**
 * @param status - The status of the bridge history item
 * @param bridgeHistoryItem - The bridge history item
 * @returns Whether the bridge history item is delayed
 */
export const getIsDelayed = (
  status: StatusTypes,
  bridgeHistoryItem?: BridgeHistoryItem,
) => {
  const tenMinutesInMs = 10 * MINUTE;
  return Boolean(
    status === StatusTypes.PENDING &&
      bridgeHistoryItem?.startTime &&
      Date.now() >
        bridgeHistoryItem.startTime +
          tenMinutesInMs +
          bridgeHistoryItem.estimatedProcessingTimeInSeconds * 1000,
  );
};

export const STATUS_TO_COLOR_MAP: Record<
  StatusTypes | TransactionStatus,
  TextColor
> = {
  [StatusTypes.PENDING]: TextColor.warningDefault,
  [StatusTypes.COMPLETE]: TextColor.successDefault,
  [StatusTypes.FAILED]: TextColor.errorDefault,
  [StatusTypes.UNKNOWN]: TextColor.errorDefault,
  [TransactionStatus.unapproved]: TextColor.warningDefault,
  [TransactionStatus.confirmed]: TextColor.successDefault,
  [TransactionStatus.rejected]: TextColor.errorDefault,
  [TransactionStatus.cancelled]: TextColor.errorDefault,
  [TransactionStatus.failed]: TextColor.errorDefault,
  [TransactionStatus.submitted]: TextColor.warningDefault,
  [TransactionStatus.approved]: TextColor.warningDefault,
  [TransactionStatus.signed]: TextColor.warningDefault,
  [TransactionStatus.dropped]: TextColor.errorDefault,
};
