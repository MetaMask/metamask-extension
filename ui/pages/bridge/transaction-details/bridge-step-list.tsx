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
import { Numeric } from '../../../../shared/modules/Numeric';
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
  const steps =
    bridgeHistoryItem?.quote.steps ||
    srcChainTxMeta?.bridgeSteps?.map((step) => ({
      // Convert hex to numbers
      ...step,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      action: step.action as any,
      srcChainId: new Numeric(step.srcChainId, 16).toBase(10).toNumber(),
      destChainId: step.destChainId
        ? new Numeric(step.destChainId, 16).toBase(10).toNumber()
        : undefined,
      srcAsset: {
        ...step.srcAsset,
        chainId: new Numeric(step.srcAsset.chainId, 16).toBase(10).toNumber(),
      },
      destAsset: {
        ...step.destAsset,
        chainId: new Numeric(step.destAsset.chainId, 16).toBase(10).toNumber(),
      },
    })) ||
    [];
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
            bridgeHistoryItem?.startTime || srcChainTxMeta?.time,
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
              step={step as Step}
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
