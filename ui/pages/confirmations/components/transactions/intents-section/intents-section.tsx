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

type SelectedToken = {
  address?: Hex;
  chainId: Hex;
};

export function IntentsSection() {
  const isAdvanced = useSelector(selectConfirmationAdvancedDetailsOpen);

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId: targetChainId } = transactionMeta;

  const [token, setToken] = useState<SelectedToken>({
    chainId: targetChainId,
  });

  const { gasFeeFormatted, loading, sourceTokenAmountFormatted } =
    useIntentsQuote({
      srcChainId: token.chainId,
      tokenAddress: token.address,
    });

  return (
    <ConfirmInfoSection>
      <IntentAssetRow
        loading={loading}
        onChange={setToken}
        sourceTokenAmount={sourceTokenAmountFormatted}
        targetChainId={targetChainId}
      />
      {!loading && isAdvanced && gasFeeFormatted && (
        <>
          <ConfirmInfoRow label="Network Fee">
            <ConfirmInfoRowText text={gasFeeFormatted ?? ''} />
          </ConfirmInfoRow>
        </>
      )}
    </ConfirmInfoSection>
  );
}

function IntentAssetRow({
  loading,
  onChange,
  sourceTokenAmount,
  targetChainId,
}: {
  loading?: boolean;
  onChange?: (token: SelectedToken) => void;
  sourceTokenAmount?: string;
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
      address: asset.address as Hex,
      chainId: network.chainId,
    });
  }, [asset.address, network.chainId, onChange]);

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
        {!loading && (
          <Text variant={TextVariant.bodyMd}>{sourceTokenAmount}</Text>
        )}
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
          <AvatarNetwork
            className="intents-network-icon"
            size={AvatarNetworkSize.Xs}
            src={networkImageSrc}
            name={network.name}
          />
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
