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
        {steps.map((step, i) => {
          const prevStepStatus = i > 0 ? stepStatuses[i - 1] : null;
          const stepStatus = stepStatuses[i];
          const nextStepStatus =
            i < stepStatuses.length - 1 ? stepStatuses[i + 1] : null;

          const isEdgeComplete =
            stepStatus === StatusTypes.COMPLETE &&
            nextStepStatus === StatusTypes.COMPLETE;

          // Making a distinction betweeen displayedStepStatus and stepStatus
          // stepStatus is determined independently of other steps
          // So despite both being technically PENDING,
          // We only want a single spinner animation at a time, so we need to take into account other steps
          const displayedStepStatus =
            prevStepStatus === StatusTypes.PENDING &&
            stepStatus === StatusTypes.PENDING
              ? null
              : stepStatus;

          return (
            <StepProgressItem
              key={`progress-${step.action}-${step.srcChainId}-${step.destChainId}`}
              stepStatus={displayedStepStatus}
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
              key={`desc-${step.action}-${step.srcChainId}-${step.destChainId}`}
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
