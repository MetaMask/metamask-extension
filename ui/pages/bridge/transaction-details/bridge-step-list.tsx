import React from 'react';
import { NetworkConfiguration } from '@metamask/network-controller';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  Box,
  Icon,
  IconName,
  Text,
} from '../../../components/component-library';
import {
  Display,
  FlexDirection,
  TextTransform,
} from '../../../helpers/constants/design-system';
import {
  ActionTypes,
  BridgeHistoryItem,
} from '../../../../app/scripts/controllers/bridge-status/types';
import { getNetworkConfigurationsByChainId } from '../../../selectors';
import BridgeStep from './bridge-step';

type BridgeStepsProps = {
  bridgeHistoryItem: BridgeHistoryItem;
  srcChainTxMeta?: TransactionMeta;
};

export default function BridgeStepList({
  bridgeHistoryItem,
  srcChainTxMeta,
}: BridgeStepsProps) {
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const steps = bridgeHistoryItem.quote.steps;

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
      {steps.map((step) => (
        <BridgeStep
          step={step}
          networkConfigurationsByChainId={networkConfigurationsByChainId}
          srcChainTxMeta={srcChainTxMeta}
          bridgeHistoryItem={bridgeHistoryItem}
        />
      ))}
    </Box>
  );
}
