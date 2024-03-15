import React from 'react';
import { NameType } from '@metamask/name-controller';
import { Text } from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Name from '../name';
import { AssetInfo } from './types';

const EthAssetPill: React.FC = () => (
  <Text
    display={Display.Flex}
    flexDirection={FlexDirection.Row}
    borderRadius={BorderRadius.pill}
    alignItems={AlignItems.center}
    backgroundColor={BackgroundColor.backgroundAlternative}
    gap={1}
    style={{
      padding: '0px 8px 0 4px',
    }}
    variant={TextVariant.bodyMd}
  >
    <img alt="ETH logo" src="./images/eth_badge.svg" width="18px" />
    ETH
  </Text>
);

/**
 * Displays a pill with an asset's icon and name.
 *
 * @param props
 * @param props.assetInfo
 */
export const AssetPill: React.FC<{ assetInfo: AssetInfo }> = ({
  assetInfo,
}) => {
  if (assetInfo.isNative) {
    return <EthAssetPill />;
  }
  return (
    <Name type={NameType.ETHEREUM_ADDRESS} value={assetInfo.contractAddress} />
  );
};
