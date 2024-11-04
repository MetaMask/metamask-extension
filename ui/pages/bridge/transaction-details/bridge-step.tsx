import React from 'react';
import { NetworkConfiguration } from '@metamask/network-controller';
import {
  ActionTypes,
  StatusTypes,
  Step,
} from '../../../../app/scripts/controllers/bridge-status/types';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import { Numeric } from '../../../../shared/modules/Numeric';
import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';

/**
 * bridge actions will have srcChainId and destChainId different from each other
 * We cannot infer the status of the bridge action since 2 different chains are involved
 * The best we can do is the bridgeHistoryItem.estimatedProcessingTimeInSeconds
 */
const getBridgeActionText = (
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

/**
 * swap actions can have srcChainId and destChainId the same
 * Despite not having any actual timestamp,
 * we can infer the status of the swap action based on the status of the source chain tx if srcChainId and destChainId are the same
 */
const getSwapActionStatus = (step: Step, srcChainTxMeta?: TransactionMeta) => {
  const isSrcAndDestChainSame = step.srcChainId === step.destChainId;
  const isSrcChainTxConfirmed =
    srcChainTxMeta?.status === TransactionStatus.confirmed;

  return isSrcAndDestChainSame && isSrcChainTxConfirmed
    ? StatusTypes.COMPLETE
    : StatusTypes.PENDING;
};

const getSwapActionText = (step: Step, srcChainTxMeta?: TransactionMeta) => {
  const swapActionStatus = getSwapActionStatus(step, srcChainTxMeta);

  return swapActionStatus === StatusTypes.COMPLETE
    ? `Swapped ${step.srcAsset.symbol} for ${step.destAsset.symbol}`
    : `Swapping ${step.srcAsset.symbol} for ${step.destAsset.symbol}`;
};

type BridgeStepProps = {
  step: Step;
  networkConfigurationsByChainId: Record<`0x${string}`, NetworkConfiguration>;
  time?: string;
  srcChainTxMeta?: TransactionMeta;
};

export default function BridgeStep({
  step,
  networkConfigurationsByChainId,
  time,
  srcChainTxMeta,
}: BridgeStepProps) {
  return (
    <Box>
      {/* <Icon name={IconName.circle} /> */}
      <Icon
        className="bridge-transaction-details__icon-loading"
        name={IconName.Loading}
        // color={iconColor}
        size={IconSize.Md}
      />
      <Icon name={IconName.FullCircle} />
      <Text>{time}</Text>
      <Text>
        {step.action === ActionTypes.BRIDGE &&
          getBridgeActionText(step, networkConfigurationsByChainId)}
        {step.action === ActionTypes.SWAP &&
          getSwapActionText(step, srcChainTxMeta)}
      </Text>
    </Box>
  );
}
