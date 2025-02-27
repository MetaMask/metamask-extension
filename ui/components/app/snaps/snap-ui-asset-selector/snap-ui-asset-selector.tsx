import React, { FunctionComponent } from 'react';
import { CaipAccountId, CaipChainId } from '@metamask/utils';

import { SnapUISelector } from '../snap-ui-selector';

import {
  Display,
  FlexDirection,
  TextAlign,
  TextColor,
  TextVariant,
  AlignItems,
  BackgroundColor,
  BlockSize,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Text,
  AvatarToken,
  BadgeWrapper,
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../../component-library';

import { SnapUIAsset, useSnapAssetSelectorData } from './useSnapAssetDisplay';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const SnapUIAssetSelectorOption: FunctionComponent<SnapUIAsset> = ({
  icon,
  symbol,
  name,
  balance,
  fiat,
  networkName,
  networkIcon,
}) => (
  <Box
    display={Display.Flex}
    alignItems={AlignItems.center}
    width={BlockSize.Full}
    gap={4}
  >
    <Box alignItems={AlignItems.center}>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            size={AvatarNetworkSize.Xs}
            name={networkName}
            src={networkIcon}
            backgroundColor={BackgroundColor.backgroundDefault}
          />
        }
      >
        <AvatarToken src={icon} />
      </BadgeWrapper>
    </Box>
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      style={{ overflow: 'hidden' }}
    >
      <Text variant={TextVariant.bodyMdMedium} ellipsis>
        {name}
      </Text>
      <Text
        color={TextColor.textAlternative}
        variant={TextVariant.bodySm}
        ellipsis
      >
        {networkName}
      </Text>
    </Box>
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      marginLeft={'auto'}
      textAlign={TextAlign.End}
    >
      <Text variant={TextVariant.bodySmMedium}>
        {balance} {symbol}
      </Text>
      <Text color={TextColor.textAlternative} variant={TextVariant.bodySm}>
        {fiat}
      </Text>
    </Box>
  </Box>
);

type SnapUIAssetSelectorProps = {
  name: string;
  addresses: CaipAccountId[];
  chainIds?: CaipChainId[];
  disabled?: boolean;
  form?: string;
  label?: string;
  error?: string;
};

export const SnapUIAssetSelector: FunctionComponent<
  SnapUIAssetSelectorProps
> = ({ addresses, chainIds, disabled, ...props }) => {
  const t = useI18nContext();
  const assets = useSnapAssetSelectorData({ addresses, chainIds });

  const options = assets.map(({ address, name, symbol }) => ({
    key: 'asset',
    value: { asset: address, name, symbol },
    disabled: false,
  }));

  const optionComponents = assets.map((asset, index) => (
    <SnapUIAssetSelectorOption {...asset} key={index} />
  ));

  return (
    <SnapUISelector
      title={t('snapUIAssetSelectorTitle')}
      options={options}
      optionComponents={optionComponents}
      disabled={disabled || assets.length === 0}
      {...props}
    />
  );
};
