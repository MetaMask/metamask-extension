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
  AlignItems,
  Color,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextTransform,
} from '../../../helpers/constants/design-system';
import {
  ActionTypes,
  BridgeHistoryItem,
  StatusTypes,
} from '../../../../app/scripts/controllers/bridge-status/types';
import { getNetworkConfigurationsByChainId } from '../../../selectors';
import BridgeStep, { getStepStatus } from './bridge-step';
import HollowCircle from './hollow-circle';

const iconColor = IconColor.primaryDefault;

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
          const stepStatus = stepStatuses[i];
          return (
            <>
              {stepStatus === null && <HollowCircle color={iconColor} />}
              {stepStatus === StatusTypes.PENDING && (
                <Icon
                  className="bridge-transaction-details__icon-loading" // Needed for animation
                  name={IconName.Loading}
                  color={iconColor}
                />
              )}
              {stepStatus === StatusTypes.COMPLETE && (
                <Icon name={IconName.FullCircle} color={iconColor} />
              )}
              {i !== steps.length - 1 && (
                <div
                  style={{
                    height: '46px',
                    width: '1px',
                    backgroundColor: `var(--color-${Color.iconMuted})`,
                  }}
                />
              )}
            </>
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
              srcChainTxMeta={srcChainTxMeta}
              bridgeHistoryItem={bridgeHistoryItem}
              stepStatus={stepStatus}
            />
          );
        })}
      </Box>
    </Box>
  );
}
