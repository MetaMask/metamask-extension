import React from 'react';
import { NetworkConfiguration } from '@metamask/network-controller';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Box } from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  BridgeHistoryItem,
  StatusTypes,
} from '../../../../app/scripts/controllers/bridge-status/types';
import { getNetworkConfigurationsByChainId } from '../../../selectors';
import BridgeStep, { getStepStatus } from './bridge-step';
import StepProgressItem from './step-progress-item';

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
  const stepStatuses = steps.map((step) =>
    getStepStatus(bridgeHistoryItem, step, srcChainTxMeta),
  );

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.flexStart}
      gap={4}
    >
      {/* Dots and vertical lines */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
      >
        {steps.map((_, i) => {
          const stepStatus = stepStatuses[i];
          const nextStepStatus =
            i < stepStatus.length - 1 ? stepStatuses[i + 1] : null;

          const isEdgeComplete =
            stepStatus === StatusTypes.COMPLETE &&
            nextStepStatus === StatusTypes.COMPLETE;

          return (
            <StepProgressItem
              stepStatus={stepStatus}
              isLastItem={i === steps.length - 1}
              isEdgeComplete={isEdgeComplete}
            />
          );
        })}
      </Box>

      {/* Time and descriptions */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        gap={8}
      >
        {steps.map((step, i) => {
          const stepStatus = stepStatuses[i];
          return (
            <BridgeStep
              step={step}
              networkConfigurationsByChainId={networkConfigurationsByChainId}
              stepStatus={stepStatus}
            />
          );
        })}
      </Box>
    </Box>
  );
}
