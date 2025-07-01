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

type SelectedToken = {
  address: Hex;
  chainId: Hex;
};

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

function IntentsSourceRow({
  loading,
  onChange,
  sourceTokenAmounts,
  sourceTokenChainId,
  sourceTokenAddress,
  targetChainId,
}: {
  loading?: boolean;
  onChange?: (token: SelectedToken) => void;
  sourceTokenAmounts?: IntentSourceAmounts;
  sourceTokenChainId: Hex;
  sourceTokenAddress: Hex;
  targetChainId: Hex;
}) {
  const [asset, setAsset] = useState<
    AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>
  >({
    chainId: targetChainId,
    image: './images/eth_logo.svg',
    type: AssetType.native,
    symbol: 'ETH',
  } as never);

  const defaultNetwork = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, targetChainId),
  );

  const [network, setNetwork] = useState<NetworkConfiguration>(defaultNetwork);

  useEffect(() => {
    onChange?.({
      address: (asset.address as Hex) || NATIVE_TOKEN_ADDRESS,
      chainId: network.chainId,
    });
  }, [asset.address, network.chainId, onChange]);

  const sourceAmountTotal = sourceTokenAmounts
    ?.reduce(
      (acc, amount) =>
        acc.plus(new BigNumber(amount.sourceTokenAmountFormatted)),
      new BigNumber(0),
    )
    .round(6)
    .toString();

  const sourceTokenFiat = useTokenFiatAmount(
    sourceTokenAddress,
    sourceAmountTotal,
    undefined,
    {},
    true,
    sourceTokenChainId,
  );

  return (
    <ConfirmInfoRow label="Pay">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.flexEnd}
        alignItems={AlignItems.center}
        gap={2}
      >
        {loading && (
          <div role="progressbar">
            <Preloader size={20} />
          </div>
        )}
        <Text>{sourceTokenFiat}</Text>
        <Text>{sourceAmountTotal}</Text>
        <AssetPickerWrapper
          asset={asset}
          network={network}
          onAssetChange={(newAsset) => setAsset(newAsset)}
          onNetworkChange={(newNetwork) => setNetwork(newNetwork)}
        />
      </Box>
    </ConfirmInfoRow>
  );
}

function AssetPickerWrapper({
  asset,
  network,
  onAssetChange,
  onNetworkChange,
}: {
  asset: AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>;
  network: NetworkConfiguration;
  onAssetChange: (
    asset: AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>,
  ) => void;
  onNetworkChange: (network: NetworkConfiguration) => void;
}) {
  const supportedChains = useSelector(getFromChains);

  return (
    <AssetPicker
      asset={asset}
      header="Select token"
      isMultiselectEnabled={true}
      visibleTabs={[TabName.TOKENS]}
      onAssetChange={onAssetChange}
      networkProps={{
        network,
        networks: supportedChains,
        onNetworkChange: (network) =>
          onNetworkChange(network as NetworkConfiguration),
      }}
    >
      {(onClickHandler, networkImageSrc) => (
        <AssetPickerOverride
          asset={asset}
          network={network}
          networkImageSrc={networkImageSrc}
          onClick={onClickHandler}
        />
      )}
    </AssetPicker>
  );
}

function AssetPickerOverride({
  asset,
  network,
  networkImageSrc,
  onClick,
}: {
  asset: AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>;
  network: NetworkConfiguration;
  networkImageSrc?: string;
  onClick?: () => void;
}) {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      borderRadius={BorderRadius.pill}
      borderColor={BorderColor.borderMuted}
      alignItems={AlignItems.center}
      gap={2}
      paddingInline={2}
      onClick={onClick}
      style={{
        cursor: 'pointer',
      }}
    >
      <BadgeWrapper
        className="intents-network-icon-wrapper"
        badge={
          networkImageSrc ? (
            <AvatarNetwork
              className="intents-network-icon"
              size={AvatarNetworkSize.Xs}
              src={networkImageSrc}
              name={network.name}
            />
          ) : undefined
        }
      >
        <AvatarToken
          borderRadius={BorderRadius.full}
          src={asset.image}
          size={AvatarTokenSize.Xs}
        />
      </BadgeWrapper>
      <Text>{asset.symbol}</Text>
      <Icon name={IconName.ArrowDown} size={IconSize.Sm} />
    </Box>
  );
}
