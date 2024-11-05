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
        {steps.map((step, i) => (
          <>
            <Icon name={IconName.FullCircle} color={IconColor.primaryDefault} />
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
        ))}
      </Box>

      {/* Time and descriptions */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        gap={8}
      >
        {steps.map((step, i) => (
          <>
            <BridgeStep
              step={step}
              networkConfigurationsByChainId={networkConfigurationsByChainId}
              srcChainTxMeta={srcChainTxMeta}
              bridgeHistoryItem={bridgeHistoryItem}
            />
          </>
        ))}
      </Box>
    </Box>
  );
}
