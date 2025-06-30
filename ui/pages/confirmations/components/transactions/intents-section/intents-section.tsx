import React, { useEffect, useState } from 'react';
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
import { Hex } from '@metamask/utils';
import { selectConfirmationAdvancedDetailsOpen } from '../../../selectors/preferences';
import Preloader from '../../../../../components/ui/icon/preloader';
import Name from '../../../../../components/app/name';
import { NameType } from '@metamask/name-controller';
import { useIntentsTarget } from '../../../hooks/transactions/useIntentsTarget';
import { useIntentSourceAmount } from '../../../hooks/transactions/useIntentSourceAmount';
import { useIntentsAsset } from '../../../hooks/transactions/useIntentsAsset';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../helpers/constants/intents';
import BigNumber from 'bignumber.js';
import { useTokenFiatAmount } from '../../../../../hooks/useTokenFiatAmount';

type SelectedToken = {
  address: Hex;
  chainId: Hex;
};

export function IntentsSection() {
  const isAdvanced = useSelector(selectConfirmationAdvancedDetailsOpen);

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId: targetChainId } = transactionMeta;

  const [sourceToken, setSourceToken] = useState<SelectedToken>({
    address: NATIVE_TOKEN_ADDRESS,
    chainId: targetChainId,
  });

  const { targetTokenAddress, targetAmount } = useIntentsTarget();

  const {
    decimals: sourceDecimals,
    fiatRate: sourceFiatRate,
    loading: sourceAssetLoading,
  } = useIntentsAsset({
    chainId: sourceToken.chainId,
    tokenAddress: sourceToken.address,
  });

  const {
    decimals: targetDecimals,
    fiatRate: targetFiatRate,
    loading: targetAssetLoading,
  } = useIntentsAsset({
    chainId: targetChainId,
    tokenAddress: targetTokenAddress,
  });

  const {
    sourceTokenAmountFormatted,
    sourceTokenAmountRaw,
    sourceAmountFeeFormatted,
  } = useIntentSourceAmount({
    sourceDecimals,
    sourceFiatRate,
    targetDecimals,
    targetFiatRate,
    targetAmount,
  });

  const { gasFeeFormatted, loading: quoteLoading } = useIntentsQuote({
    sourceChainId: sourceToken.chainId,
    sourceTokenAddress: sourceToken.address as Hex,
    targetTokenAddress,
    sourceTokenAmount: sourceTokenAmountRaw,
  });

  const loading = sourceAssetLoading || targetAssetLoading || quoteLoading;

  return (
    <ConfirmInfoSection>
      <IntentsSourceRow
        loading={loading}
        onChange={setSourceToken}
        sourceTokenAmount={sourceTokenAmountFormatted}
        sourceTokenChainId={sourceToken.chainId}
        sourceTokenAddress={sourceToken.address}
        targetChainId={targetChainId}
      />
      {isAdvanced && (
        <IntentsTargetRow
          targetAmount={targetAmount}
          targetChainId={targetChainId}
          targetDecimals={targetDecimals}
          targetTokenAddress={targetTokenAddress}
        />
      )}
      {!loading && isAdvanced && (
        <IntentsFeeRow
          feeFormatted={sourceAmountFeeFormatted}
          sourceChainId={sourceToken.chainId}
          sourceTokenAddress={sourceToken.address}
        />
      )}
      {!loading && isAdvanced && (
        <IntentsNetworkFeeRow gasFeeFormatted={gasFeeFormatted} />
      )}
    </ConfirmInfoSection>
  );
}

function IntentsFeeRow({
  feeFormatted,
  sourceChainId,
  sourceTokenAddress,
}: {
  feeFormatted?: string;
  sourceChainId: Hex;
  sourceTokenAddress: Hex;
}) {
  if (!feeFormatted) {
    return null;
  }

  const feeFiat = useTokenFiatAmount(
    sourceTokenAddress,
    feeFormatted,
    undefined,
    {},
    true,
    sourceChainId,
  );

  return (
    <ConfirmInfoRow label="Fee">
      <ConfirmInfoRowText text={`${feeFiat} ${feeFormatted}`} />
    </ConfirmInfoRow>
  );
}

function IntentsNetworkFeeRow({
  gasFeeFormatted,
}: {
  gasFeeFormatted?: string;
}) {
  if (!gasFeeFormatted) {
    return null;
  }

  return (
    <ConfirmInfoRow label="Network Fee">
      <ConfirmInfoRowText text={gasFeeFormatted} />
    </ConfirmInfoRow>
  );
}

function IntentsTargetRow({
  targetAmount,
  targetChainId,
  targetDecimals,
  targetTokenAddress,
}: {
  targetAmount?: string;
  targetChainId: Hex;
  targetDecimals?: number;
  targetTokenAddress: Hex;
}) {
  const targetAmountFormatted =
    targetAmount && targetDecimals
      ? new BigNumber(targetAmount).shift(-targetDecimals).round(6).toString()
      : undefined;

  const targetAmountFiat = useTokenFiatAmount(
    targetTokenAddress,
    targetAmountFormatted,
    undefined,
    {},
    true,
    targetChainId,
  );

  return (
    <ConfirmInfoRow label="Target">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.flexEnd}
        alignItems={AlignItems.center}
        gap={2}
      >
        <Text>{targetAmountFiat}</Text>
        <Text>{targetAmountFormatted}</Text>
        <Name
          type={NameType.ETHEREUM_ADDRESS}
          value={targetTokenAddress}
          variation={targetChainId}
        />
      </Box>
    </ConfirmInfoRow>
  );
}

function IntentsSourceRow({
  loading,
  onChange,
  sourceTokenAmount,
  sourceTokenChainId,
  sourceTokenAddress,
  targetChainId,
}: {
  loading?: boolean;
  onChange?: (token: SelectedToken) => void;
  sourceTokenAmount?: string;
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

  const sourceTokenFiat = useTokenFiatAmount(
    sourceTokenAddress,
    sourceTokenAmount,
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
        <Text>{sourceTokenAmount}</Text>
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
