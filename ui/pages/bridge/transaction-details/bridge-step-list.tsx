import React from 'react';
import { NetworkConfiguration } from '@metamask/network-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { Box } from '../../../components/component-library';
import {
  BridgeHistoryItem,
  StatusTypes,
  Step,
} from '../../../../shared/types/bridge-status';
import { formatDate } from '../../../helpers/utils/util';
import BridgeStepDescription, {
  getStepStatus,
} from './bridge-step-description';
import StepProgressBarItem from './step-progress-bar-item';

const getTime = (
  index: number,
  isLastIndex: boolean,
  startTime?: number,
  estimatedProcessingTimeInSeconds?: number,
) => {
  if (index === 0) {
    return startTime;
  }

  return isLastIndex && startTime && estimatedProcessingTimeInSeconds
    ? startTime + estimatedProcessingTimeInSeconds * 1000
    : undefined;
};

type BridgeStepsProps = {
  bridgeHistoryItem?: BridgeHistoryItem;
  srcChainTxMeta?: TransactionMeta;
  networkConfigurationsByChainId: Record<Hex, NetworkConfiguration>;
};

export default function BridgeStepList({
  bridgeHistoryItem,
  srcChainTxMeta,
  networkConfigurationsByChainId,
}: BridgeStepsProps) {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const steps = bridgeHistoryItem?.quote.steps || [];
  const stepStatuses = steps.map((step) =>
    getStepStatus({ bridgeHistoryItem, step: step as Step, srcChainTxMeta }),
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
          (nextStepStatus === StatusTypes.PENDING ||
            nextStepStatus === StatusTypes.COMPLETE);

        // Making a distinction betweeen displayedStepStatus and stepStatus
        // stepStatus is determined independently of other steps
        // So despite both being technically PENDING,
        // We only want a single spinner animation at a time, so we need to take into account other steps
        const displayedStepStatus =
          prevStepStatus === StatusTypes.PENDING &&
          stepStatus === StatusTypes.PENDING
            ? null
            : stepStatus;

        const time = formatDate(
          getTime(
            i,
            i === steps.length - 1,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            bridgeHistoryItem?.startTime || srcChainTxMeta?.time,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            bridgeHistoryItem?.estimatedProcessingTimeInSeconds || 0,
          ),
          'hh:mm a',
        );

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
              time={time}
            />
          </StepProgressBarItem>
        );
      })}
    </Box>
  );
}
