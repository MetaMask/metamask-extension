import React from 'react';
import {
  type TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { getDestTxStatus, getSrcTxStatus, type BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { StatusTypes } from '@metamask/bridge-controller';
import { Box, Text } from '../../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  TextColor,
} from '../../../helpers/constants/design-system';
import type { TransactionGroup } from '../../../hooks/bridge/useBridgeTxHistoryData';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Segment from './segment';

const getTxIndex = (srcTxStatus: StatusTypes) => {
  if (srcTxStatus === StatusTypes.PENDING) {
    return 1;
  }

  if (srcTxStatus === StatusTypes.COMPLETE) {
    return 2;
  }

  throw new Error('No more possible states for srcTxStatus');
};


/**
 * Renders the 2 transaction segments for a bridge activity item
 *
 * @param options
 * @param options.bridgeTxHistoryItem - The bridge history item for the transaction
 * @param options.transactionGroup - The transaction group for the transaction
 */
export default function BridgeActivityItemTxSegments({
  bridgeTxHistoryItem,
  transactionGroup,
}: {
  bridgeTxHistoryItem?: BridgeHistoryItem;
  transactionGroup: TransactionGroup;
}) {
  const t = useI18nContext();
  const { initialTransaction } = transactionGroup;
  const srcTxStatus = getSrcTxStatus(initialTransaction);
  const destTxStatus = getDestTxStatus({ bridgeTxHistoryItem, srcTxStatus });
  const txIndex = getTxIndex(srcTxStatus);

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
      <Text color={TextColor.textAlternative}>
        {t('bridgeTransactionProgress', [txIndex])}
      </Text>
      <Box display={Display.Flex} gap={2} width={BlockSize.Full}>
        <Segment type={srcTxStatus} />
        <Segment type={destTxStatus} />
      </Box>
    </Box>
  );
}
