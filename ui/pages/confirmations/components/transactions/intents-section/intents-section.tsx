import React, { memo, useEffect, useMemo, useState } from 'react';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../components/app/confirm/info/row';
import { useIntentsQuote } from '../../../hooks/transactions/useIntentsQuote';
import { AssetPicker } from '../../../../../components/multichain/asset-picker-amount/asset-picker';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../../../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../components/component-library';
import { NetworkConfiguration } from '@metamask/network-controller';
import { TabName } from '../../../../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import { useSelector } from 'react-redux';
import { getFromChains } from '../../../../../ducks/bridge/selectors';
import { selectNetworkConfigurationByChainId } from '../../../../../selectors';
import { useConfirmContext } from '../../../context/confirm';
import { TransactionMeta } from '@metamask/transaction-controller';
import { AssetType } from '@metamask/bridge-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import { selectConfirmationAdvancedDetailsOpen } from '../../../selectors/preferences';
import Preloader from '../../../../../components/ui/icon/preloader';
import { useIntentsTarget } from '../../../hooks/transactions/useIntentsTarget';
import {
  IntentSourceAmounts,
  useIntentSourceAmounts,
} from '../../../hooks/transactions/useIntentSourceAmount';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../helpers/constants/intents';
import BigNumber from 'bignumber.js';
import { useTokenFiatAmount } from '../../../../../hooks/useTokenFiatAmount';
import { IntentsTargetRow } from '../intents-target-row/intents-target-row';
import {
  IntentsSourceRow,
  SelectedToken,
} from '../intents-source-row/intents-source-row';

const log = createProjectLogger('intents');

export const IntentsSection = memo(function IntentsSection() {
  const isAdvanced = useSelector(selectConfirmationAdvancedDetailsOpen);

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId: targetChainId } = transactionMeta;

  const [sourceToken, setSourceToken] = useState<SelectedToken>({
    address: NATIVE_TOKEN_ADDRESS,
    chainId: targetChainId,
  });

  const targets = useIntentsTarget();

  log('Targets', targets);

  const sourceAmounts = useIntentSourceAmounts({
    sourceChainId: sourceToken.chainId,
    sourceTokenAddress: sourceToken.address,
    targets,
    targetChainId,
  });

  log('Source amounts', sourceAmounts);

  const targetTokenAddress = useMemo(
    () => targets.map((t) => t.targetTokenAddress),
    [targets],
  );

  const sourceAmountsRaw = useMemo(
    () =>
      sourceAmounts?.length
        ? sourceAmounts.map((result) => result.sourceTokenAmountRaw)
        : [],
    [sourceAmounts],
  );

  const { networkFee, loading } = useIntentsQuote({
    sourceChainId: sourceToken.chainId,
    sourceTokenAddress: sourceToken.address,
    sourceTokenAmounts: sourceAmountsRaw,
    targetTokenAddresses: targetTokenAddress,
  });

  return (
    <ConfirmInfoSection>
      <IntentsSourceRow
        loading={loading}
        onChange={setSourceToken}
        sourceTokenAmounts={sourceAmounts}
        sourceTokenChainId={sourceToken.chainId}
        sourceTokenAddress={sourceToken.address}
        targetChainId={targetChainId}
      />
      {isAdvanced && (
        <IntentsTargetRow targetChainId={targetChainId} targets={targets} />
      )}
      {isAdvanced && (
        <IntentsFeeRow
          sourceAmounts={sourceAmounts}
          sourceChainId={sourceToken.chainId}
          sourceTokenAddress={sourceToken.address}
        />
      )}
      {!loading && isAdvanced && (
        <IntentsNetworkFeeRow
          networkFee={networkFee}
          sourceChainId={sourceToken.chainId}
        />
      )}
    </ConfirmInfoSection>
  );
});

function IntentsFeeRow({
  sourceAmounts,
  sourceChainId,
  sourceTokenAddress,
}: {
  sourceAmounts?: IntentSourceAmounts;
  sourceChainId: Hex;
  sourceTokenAddress: Hex;
}) {
  if (!sourceAmounts?.length) {
    return null;
  }

  const feeTotal = sourceAmounts
    .reduce(
      (acc, amount) => acc.plus(new BigNumber(amount.sourceAmountFeeFormatted)),
      new BigNumber(0),
    )
    .round(6)
    .toString();

  const feeFiat = useTokenFiatAmount(
    sourceTokenAddress,
    feeTotal,
    undefined,
    {},
    true,
    sourceChainId,
  );

  return (
    <ConfirmInfoRow label="Fee">
      <ConfirmInfoRowText text={`${feeFiat} ${feeTotal}`} />
    </ConfirmInfoRow>
  );
}

function IntentsNetworkFeeRow({
  networkFee,
  sourceChainId,
}: {
  networkFee?: string;
  sourceChainId: Hex;
}) {
  if (!networkFee) {
    return null;
  }

  const networkFeeFiat = useTokenFiatAmount(
    NATIVE_TOKEN_ADDRESS,
    networkFee,
    undefined,
    {},
    true,
    sourceChainId,
  );

  return (
    <ConfirmInfoRow label="Network Fee">
      <ConfirmInfoRowText text={`${networkFeeFiat} ${networkFee}`} />
    </ConfirmInfoRow>
  );
}
