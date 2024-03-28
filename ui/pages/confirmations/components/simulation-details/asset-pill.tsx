import React from 'react';
import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import {
  AvatarNetwork,
  AvatarNetworkSize,
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
import { getNativeCurrencyImage } from '../../../../selectors';
import { getNativeCurrency } from '../../../../ducks/metamask/metamask';
import { AssetIdentifier } from './types';

const NativeAssetPill: React.FC = () => {
  const ticker = useSelector(getNativeCurrency);
  const imgSrc = useSelector(getNativeCurrencyImage);

  return (
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
      <AvatarNetwork name={ticker} size={AvatarNetworkSize.Sm} src={imgSrc} />
      <Text variant={TextVariant.bodyMd}>{ticker}</Text>
    </Box>
  );
};

/**
 * Displays a pill with an asset's icon and name.
 *
 * @param props
 * @param props.asset
 */
export const AssetPill: React.FC<{ asset: AssetIdentifier }> = ({ asset }) => {
  if (asset.standard === TokenStandard.none) {
    return <NativeAssetPill />;
  }
  return (
    <Name
      type={NameType.ETHEREUM_ADDRESS}
      value={asset.address}
      preferContractSymbol
    />
  );
};
