import React from 'react';
import { NetworkConfiguration } from '@metamask/network-controller';
import {
  ActionTypes,
  Step,
} from '../../../../app/scripts/controllers/bridge-status/types';
import {
  Box,
  Icon,
  IconName,
  Text,
} from '../../../components/component-library';
import { Numeric } from '../../../../shared/modules/Numeric';
import { Hex } from '@metamask/utils';

type BridgeStepProps = {
  step: Step;
  networkConfigurationsByChainId: Record<`0x${string}`, NetworkConfiguration>;
  time?: string;
};

const getBridgeText = (
  step: Step,
  networkConfigurationsByChainId: Record<`0x${string}`, NetworkConfiguration>,
) => {
  const hexSrcChainId = new Numeric(
    step.srcChainId,
    10,
  ).toPrefixedHexString() as Hex;
  const srcNetworkConfiguration = networkConfigurationsByChainId[hexSrcChainId];

  const hexDestChainId = step.destChainId
    ? (new Numeric(step.destChainId, 10).toPrefixedHexString() as Hex)
    : undefined;
  const destNetworkConfiguration = hexDestChainId
    ? networkConfigurationsByChainId[hexDestChainId]
    : undefined;

  return `Bridging ${step.srcAsset.symbol} from ${srcNetworkConfiguration.name} to ${destNetworkConfiguration?.name}`;
};
const getSwapText = (step: Step) => {
  return `Swapping ${step.srcAsset.symbol} for ${step.destAsset.symbol}`;
};

export default function BridgeStep({
  step,
  networkConfigurationsByChainId,
  time,
}: BridgeStepProps) {
  return (
    <Box>
      <Icon name={IconName.FullCircle} />
      <Text>{time}</Text>
      <Text>
        {step.action === ActionTypes.BRIDGE &&
          getBridgeText(step, networkConfigurationsByChainId)}
        {step.action === ActionTypes.SWAP && getSwapText(step)}
      </Text>
    </Box>
  );
}
