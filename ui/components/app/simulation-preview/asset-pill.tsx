import React from 'react';
import { NameType } from '@metamask/name-controller';
import { AvatarToken, AvatarTokenSize, Text } from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Name from '../name';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { AssetIdentifier } from './types';

const EthAssetPill: React.FC = () => (
  <Text
    display={Display.Flex}
    flexDirection={FlexDirection.Row}
    borderRadius={BorderRadius.pill}
    alignItems={AlignItems.center}
    backgroundColor={BackgroundColor.backgroundAlternative}
    gap={1}
    style={{
      padding: '2px 8px 2px 4px',
    }}
    variant={TextVariant.bodyMd}
  >
    <AvatarToken
      name="eth"
      size={AvatarTokenSize.Sm}
      src="./images/eth_logo.svg"
    />
    ETH
  </Text>
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
