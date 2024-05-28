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
  BorderColor,
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
        padding: '1px 8px 1px 4px',
      }}
    >
      <AvatarNetwork
        name={ticker}
        size={AvatarNetworkSize.Xs}
        src={imgSrc}
        borderColor={BorderColor.borderDefault}
      />
      <Text ellipsis variant={TextVariant.bodyMd}>
        {ticker}
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
export const AssetPill: React.FC<{ asset: AssetIdentifier }> = ({ asset }) => (
  <Box
    data-testid="simulation-details-asset-pill"
    style={{
      flexShrink: 1,
      flexBasis: 'auto',
      minWidth: 0,
    }}
  >
    {asset.standard === TokenStandard.none ? (
      <NativeAssetPill />
    ) : (
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={asset.address}
        preferContractSymbol
      />
    )}
  </Box>
);
