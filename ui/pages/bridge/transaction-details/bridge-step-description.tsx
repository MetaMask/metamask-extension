import * as React from 'react';
import { NetworkConfiguration } from '@metamask/network-controller';
import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import {
  BridgeHistoryItem,
  Step,
  ActionTypes,
  StatusTypes,
} from '../../../../shared/types/bridge-status';
import { Box, Text } from '../../../components/component-library';
import { Numeric } from '../../../../shared/modules/Numeric';
import {
  AlignItems,
  Display,
  FontWeight,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

type I18nFunction = (
  key: string,
  args: (string | number | undefined | null)[],
) => string;

/**
 * bridge actions will have step.srcChainId !== step.destChainId
 * We cannot infer the status of the bridge action since 2 different chains are involved
 * The best we can do is the bridgeHistoryItem.estimatedProcessingTimeInSeconds
 *
 * @param t - The i18n context return value to get translations
 * @param stepStatus - The status of the step
 * @param step - The step to be rendered
 * @param networkConfigurationsByChainId - The network configurations by chain id
 */
const getBridgeActionText = (
  t: I18nFunction,
  stepStatus: StatusTypes | null,
  step: Step,
  networkConfigurationsByChainId: Record<`0x${string}`, NetworkConfiguration>,
) => {
  const hexDestChainId = step.destChainId
    ? (new Numeric(step.destChainId, 10).toPrefixedHexString() as Hex)
    : undefined;
  const destNetworkConfiguration = hexDestChainId
    ? networkConfigurationsByChainId[hexDestChainId]
    : undefined;

  return stepStatus === StatusTypes.COMPLETE
    ? t('bridgeStepActionBridgeComplete', [
        step.destAsset.symbol,
        destNetworkConfiguration?.name,
      ])
    : t('bridgeStepActionBridgePending', [
        step.destAsset.symbol,
        destNetworkConfiguration?.name,
      ]);
};

const getBridgeActionStatus = (bridgeHistoryItem: BridgeHistoryItem) => {
  return bridgeHistoryItem.status ? bridgeHistoryItem.status.status : null;
};

/**
 * swap actions can have step.srcChainId === step.destChainId, and can occur on
 * EITHER the quote.srcChainId or the quote.destChainId
 * Despite not having any actual timestamp,we can infer the status of the swap action
 * based on the status of the source chain tx if srcChainId and destChainId are the same*
 *
 * @param bridgeHistoryItem
 * @param step
 * @param srcChainTxMeta
 */
const getSwapActionStatus = (
  bridgeHistoryItem: BridgeHistoryItem,
  step: Step,
  srcChainTxMeta?: TransactionMeta,
) => {
  const isSrcAndDestChainSame = step.srcChainId === step.destChainId;
  const isSwapOnSrcChain =
    step.srcChainId === bridgeHistoryItem.quote.srcChainId;

  if (isSrcAndDestChainSame && isSwapOnSrcChain) {
    // if the swap action is on the src chain (i.e. step.srcChainId === step.destChainId === bridgeHistoryItem.quote.srcChainId),
    // we check the source chain tx status, since we know when it's confirmed
    const isSrcChainTxConfirmed =
      srcChainTxMeta?.status === TransactionStatus.confirmed;
    return isSrcChainTxConfirmed ? StatusTypes.COMPLETE : StatusTypes.PENDING;
  }
  // if the swap action is on the dest chain, we check the bridgeHistoryItem.status,
  // since we don't know when the dest tx is confirmed
  if (srcChainTxMeta?.status === TransactionStatus.confirmed) {
    return bridgeHistoryItem.status ? bridgeHistoryItem.status.status : null;
  }

  // If the source chain tx is not confirmed, we know the swap hasn't started
  // use null to represent this as we don't have an equivalent in StatusTypes
  return null;
};

const getSwapActionText = (
  t: I18nFunction,
  status: StatusTypes | null,
  step: Step,
) => {
  return status === StatusTypes.COMPLETE
    ? t('bridgeStepActionSwapComplete', [
        step.srcAsset.symbol,
        step.destAsset.symbol,
      ])
    : t('bridgeStepActionSwapPending', [
        step.srcAsset.symbol,
        step.destAsset.symbol,
      ]);
};

export const getStepStatus = (
  bridgeHistoryItem: BridgeHistoryItem,
  step: Step,
  srcChainTxMeta?: TransactionMeta,
) => {
  if (step.action === ActionTypes.SWAP) {
    return getSwapActionStatus(bridgeHistoryItem, step, srcChainTxMeta);
  } else if (step.action === ActionTypes.BRIDGE) {
    return getBridgeActionStatus(bridgeHistoryItem);
  }

  return StatusTypes.UNKNOWN;
};

type BridgeStepProps = {
  step: Step;
  networkConfigurationsByChainId: Record<`0x${string}`, NetworkConfiguration>;
  time?: string;
  stepStatus: StatusTypes | null;
};

// You can have the following cases:
// 1. Bridge: usually for cases like Optimism ETH to Arbitrum ETH
// 2. Swap > Bridge
// 3. Swap > Bridge > Swap: e.g. Optimism ETH to Avalanche USDC
export default function BridgeStepDescription({
  step,
  networkConfigurationsByChainId,
  time,
  stepStatus,
}: BridgeStepProps) {
  const t = useI18nContext() as I18nFunction;
  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      gap={2}
      className="bridge-transaction-details__step-grid--desc"
    >
      {time && <Text color={TextColor.textDefault}>{time}</Text>}
      <Text
        color={
          stepStatus === StatusTypes.PENDING ||
          stepStatus === StatusTypes.COMPLETE
            ? TextColor.textDefault
            : TextColor.textAlternative
        }
        fontWeight={
          stepStatus === StatusTypes.PENDING
            ? FontWeight.Medium
            : FontWeight.Normal
        }
      >
        {step.action === ActionTypes.BRIDGE &&
          getBridgeActionText(
            t,
            stepStatus,
            step,
            networkConfigurationsByChainId,
          )}
        {step.action === ActionTypes.SWAP &&
          getSwapActionText(t, stepStatus, step)}
      </Text>
    </Box>
  );
}
