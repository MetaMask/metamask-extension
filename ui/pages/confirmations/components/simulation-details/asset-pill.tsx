import React from 'react';
import { NameType } from '@metamask/name-controller';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import Name from '../../../../components/app/name';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import { ETH_TOKEN_IMAGE_URL } from '../../../../../shared/constants/network';
import { AssetIdentifier } from './types';

const ETH_TICKER = 'ETH';

const EthAssetPill: React.FC = () => (
  <Box
    display={Display.Flex}
    flexDirection={FlexDirection.Row}
    borderRadius={BorderRadius.pill}
    alignItems={AlignItems.center}
    backgroundColor={BackgroundColor.backgroundAlternative}
    gap={1}
    style={{
      padding: '2px 8px 2px 4px',
    }}
  >
    <AvatarToken
      name="eth"
      size={AvatarTokenSize.Sm}
      src={ETH_TOKEN_IMAGE_URL}
    />
    <Text variant={TextVariant.bodyMd}>{ETH_TICKER}</Text>
  </Box>
);

/**
 * Displays a pill with an asset's icon and name.
 *
 * @param props
 * @param props.asset
 */
export const AssetPill: React.FC<{ asset: AssetIdentifier }> = ({ asset }) => {
  if (asset.standard === TokenStandard.none) {
    return <EthAssetPill />;
  }
  return (
    <Name
      type={NameType.ETHEREUM_ADDRESS}
      value={asset.address}
      preferContractSymbol
    />
  );
};
