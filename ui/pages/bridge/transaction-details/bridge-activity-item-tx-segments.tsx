import React from 'react';
import {
  BridgeHistoryItem,
  StatusTypes,
} from '../../../../app/scripts/controllers/bridge-status/types';
import { UseBridgeDataProps } from '../utils/useBridgeData';
import { Box, Text } from '../../../components/component-library';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';

const getTxIndex = (
  srcChainTxHash: string | undefined,
  destChainTxHash: string | undefined,
) => {
  if (
    (!srcChainTxHash && !destChainTxHash) ||
    (srcChainTxHash && !destChainTxHash)
  ) {
    return 1;
  }

  if (srcChainTxHash && destChainTxHash) {
    return 2;
  }

  throw new Error('Not possible to have dest chain tx without src chain tx');
};

const getSrcTxStatus = (initialTransaction: TransactionMeta) => {
  return initialTransaction.status === TransactionStatus.confirmed
    ? StatusTypes.COMPLETE
    : StatusTypes.PENDING;
};

const getDestTxStatus = (
  bridgeTxHistoryItem: BridgeHistoryItem,
  srcTxStatus: StatusTypes,
) => {
  if (srcTxStatus !== StatusTypes.COMPLETE) {
    return null;
  }

  return bridgeTxHistoryItem?.status.destChain?.txHash &&
    bridgeTxHistoryItem.status.status === StatusTypes.COMPLETE
    ? StatusTypes.COMPLETE
    : StatusTypes.PENDING;
};

export default function BridgeActivityItemTxSegments({
  bridgeTxHistoryItem,
  transactionGroup,
}: {
  bridgeTxHistoryItem: BridgeHistoryItem;
  transactionGroup: UseBridgeDataProps['transactionGroup'];
}) {
  const { initialTransaction } = transactionGroup;
  const srcChainTxHash = bridgeTxHistoryItem?.status.srcChain.txHash;
  const destChainTxHash = bridgeTxHistoryItem?.status.destChain?.txHash;

  const txIndex = getTxIndex(srcChainTxHash, destChainTxHash);
  const srcTxStatus = getSrcTxStatus(initialTransaction);
  const destTxStatus = getDestTxStatus(bridgeTxHistoryItem, srcTxStatus);

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
      <Text color={TextColor.textAlternative}>Transaction {txIndex} of 2</Text>
      <Box display={Display.Flex} gap={2} width={BlockSize.Full}>
        {/* Not started segment */}
        <Box
          width={BlockSize.Half}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderRadius={BorderRadius.pill}
          style={{
            height: '4px',
          }}
        />
        {/* Pending segment */}
        <Box display={Display.Flex} width={BlockSize.Half}>
          <Box
            width={BlockSize.Half}
            backgroundColor={BackgroundColor.primaryDefault}
            borderRadius={BorderRadius.pill}
            style={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              height: '4px',
            }}
          />
          <Box
            width={BlockSize.Half}
            backgroundColor={BackgroundColor.backgroundAlternative}
            borderRadius={BorderRadius.pill}
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              height: '4px',
            }}
          />
        </Box>

        {/* Complete segment */}
        <Box
          width={BlockSize.Half}
          backgroundColor={BackgroundColor.primaryDefault}
          borderRadius={BorderRadius.pill}
          style={{
            height: '4px',
          }}
        />
      </Box>
    </Box>
  );
}
