import React from 'react';
import { NetworkConfiguration } from '@metamask/network-controller';
import { Step } from '../../../../app/scripts/controllers/bridge-status/types';
import { Text } from '../../../components/component-library';
import { Numeric } from '../../../../shared/modules/Numeric';
import { Hex } from '@metamask/utils';

type BridgeStepProps = {
  step: Step;
  networkConfigurationsByChainId: Record<`0x${string}`, NetworkConfiguration>;
};

export default function BridgeStepBridge({
  step,
  networkConfigurationsByChainId,
}: BridgeStepProps) {
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

  return (
    <Text>
      Bridging {step.srcAsset.symbol} from {srcNetworkConfiguration.name} to{' '}
      {destNetworkConfiguration?.name}
    </Text>
  );
}
