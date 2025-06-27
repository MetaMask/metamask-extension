import React, { useState } from 'react';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../components/app/confirm/info/row';
import { useIntentsData } from '../../../hooks/transactions/useIntentsData';
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
import { Box, Text } from '../../../../../components/component-library';
import { NetworkConfiguration } from '@metamask/network-controller';
import { TabName } from '../../../../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import { useSelector } from 'react-redux';
import { getFromChains } from '../../../../../ducks/bridge/selectors';
import { selectNetworkConfigurationByChainId } from '../../../../../selectors';
import { useConfirmContext } from '../../../context/confirm';
import { TransactionMeta } from '@metamask/transaction-controller';
import { AssetType } from '@metamask/bridge-controller';
import { Hex } from '@metamask/utils';

export function IntentsRow() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const transactionNetwork = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, transactionMeta.chainId),
  );

  const [asset, setAsset] = useState<
    AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>
  >({
    chainId: transactionMeta.chainId,
    image: './images/eth_logo.svg',
    type: AssetType.native,
    symbol: 'ETH',
  } as never);

  const [network, setNetwork] =
    useState<NetworkConfiguration>(transactionNetwork);

  const supportedChains = useSelector(getFromChains);

  const { sourceTokenAmountFormatted, networkFeeFiatFormatted } =
    useIntentsData({ tokenAddress: asset.address as Hex });

  const text = `${sourceTokenAmountFormatted} USDC + ${networkFeeFiatFormatted} Gas`;

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label="Pay">
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.flexEnd}
          alignItems={AlignItems.center}
          gap={2}
        >
          <Text variant={TextVariant.bodyMd}>{sourceTokenAmountFormatted}</Text>
          <Box
            borderRadius={BorderRadius.pill}
            borderColor={BorderColor.borderMuted}
            padding={2}
          >
            <AssetPicker
              asset={asset}
              header="Select token"
              isMultiselectEnabled={true}
              visibleTabs={[TabName.TOKENS]}
              onAssetChange={setAsset}
              networkProps={{
                network,
                networks: supportedChains,
                onNetworkChange: (network) =>
                  setNetwork(network as NetworkConfiguration),
              }}
            />
          </Box>
        </Box>
      </ConfirmInfoRow>
      {networkFeeFiatFormatted && (
        <ConfirmInfoRow label="Pay Gas Cost">
          <ConfirmInfoRowText text={networkFeeFiatFormatted} />
        </ConfirmInfoRow>
      )}
    </ConfirmInfoSection>
  );
}
