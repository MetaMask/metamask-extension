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
import BridgeStepDescription, {
  getStepStatus,
} from './bridge-step-description';
import StepProgressBarItem from './step-progress-bar-item';

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
    <Box className="bridge-transaction-details__step-grid">
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
          <StepProgressBarItem
            key={`progress-${step.action}-${step.srcChainId}-${step.destChainId}`}
            stepStatus={displayedStepStatus}
            isLastItem={i === steps.length - 1}
            isEdgeComplete={isEdgeComplete}
          >
            <BridgeStepDescription
              step={step}
              networkConfigurationsByChainId={networkConfigurationsByChainId}
              stepStatus={displayedStepStatus}
            />
          </StepProgressBarItem>
        );
      })}
    </Box>
  );
}
