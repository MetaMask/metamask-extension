import React from 'react';
import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import Name from '../../../../components/app/name';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import { getNetworkConfigurationsByChainId } from '../../../../selectors';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../../shared/constants/network';
import { AssetIdentifier } from './types';

const NativeAssetPill: React.FC<{ chainId: Hex }> = ({ chainId }) => {
  const imgSrc =
    CHAIN_ID_TOKEN_IMAGE_MAP[chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP];

  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const network = networkConfigurationsByChainId?.[chainId];
  const { nativeCurrency } = network;

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      borderRadius={BorderRadius.pill}
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.backgroundAlternative}
      gap={1}
      style={{
        padding: '1px 8px 1px 4px',
      }}
    >
      <AvatarNetwork
        name={nativeCurrency}
        size={AvatarNetworkSize.Xs}
        src={imgSrc}
        borderColor={BorderColor.borderDefault}
      />
      <Text ellipsis variant={TextVariant.bodyMd}>
        {nativeCurrency}
      </Text>
    </Box>
  );
};

/**
 * Displays a pill with an asset's icon and name.
 *
 * @param props
 * @param props.asset
 */
export const AssetPill: React.FC<{
  asset: AssetIdentifier;
}> = ({ asset }) => {
  const { chainId } = asset;

  return (
    <Box
      data-testid="simulation-details-asset-pill"
      style={{
        flexShrink: 1,
        flexBasis: 'auto',
        minWidth: 0,
      }}
    >
      {asset.standard === TokenStandard.none ? (
        <NativeAssetPill chainId={chainId} />
      ) : (
        <Name
          preferContractSymbol
          type={NameType.ETHEREUM_ADDRESS}
          value={asset.address}
          variation={chainId}
        />
      )}
    </Box>
  );
};
