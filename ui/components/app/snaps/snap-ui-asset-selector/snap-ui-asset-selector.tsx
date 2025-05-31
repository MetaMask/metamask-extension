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

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SnapUIAsset, useSnapAssetSelectorData } from './useSnapAssetDisplay';

/**
 * An option for the SnapUIAssetSelector.
 *
 * @param props - The component props.
 * @param props.icon - The asset icon.
 * @param props.symbol - The asset symbol.
 * @param props.name - The asset name.
 * @param props.balance - The asset balance.
 * @param props.fiat - The asset balance in fiat.
 * @param props.networkName - The network name.
 * @param props.networkIcon - The network icon.
 * @returns The Asset Selector option.
 */
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
    className="snap-ui-renderer__asset-selector-option"
    display={Display.Flex}
    alignItems={AlignItems.center}
    width={BlockSize.Full}
    gap={4}
    style={{ overflow: 'hidden' }}
  >
    <Box display={Display.Flex} alignItems={AlignItems.center}>
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
        <AvatarToken src={icon} name={symbol} />
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
      className="snap-ui-renderer__asset-selector-option__balance"
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

/**
 * The props for the SnapUIAssetSelector.
 */
type SnapUIAssetSelectorProps = {
  name: string;
  addresses: CaipAccountId[];
  chainIds?: CaipChainId[];
  disabled?: boolean;
  form?: string;
  label?: string;
  error?: string;
};

/**
 * The SnapUIAssetSelector component.
 *
 * @param props - The component props.
 * @param props.addresses - The addresses to get the assets for.
 * @param props.chainIds - The chainIds to filter the assets by.
 * @param props.disabled - Whether the selector is disabled.
 * @returns The AssetSelector component.
 */
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
      className="snap-ui-renderer__asset-selector"
      title={t('snapUIAssetSelectorTitle')}
      options={options}
      optionComponents={optionComponents}
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      disabled={disabled || assets.length === 0}
      {...props}
    />
  );
};
