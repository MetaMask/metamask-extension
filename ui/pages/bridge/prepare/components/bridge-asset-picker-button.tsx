import React from 'react';
import {
  SelectButtonProps,
  SelectButtonSize,
} from '../../../../components/component-library/select-button/select-button.types';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  OverflowWrap,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { AssetPicker } from '../../../../components/multichain/asset-picker-amount/asset-picker';
import { getNftImage } from '../../../../helpers/utils/nfts';
import { BridgeToken } from '../../../../ducks/bridge/types';
import { getImageForChainId } from '../../../../selectors/multichain';
import {
  formatChainIdToCaip,
  formatChainIdToHex,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  IconName,
  TextVariant,
} from '@metamask/design-system-react';
import { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { SelectButton } from '../../../../components/component-library';

export const BridgeAssetPickerButton = ({
  asset,
  network,
  ...props
}: {
  asset: BridgeToken;
  network: MultichainNetworkConfiguration;
} & SelectButtonProps<'div'>) => {
  return (
    <SelectButton
      borderRadius={BorderRadius.pill}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderColor={BorderColor.borderMuted}
      style={{
        padding: 8,
        paddingRight: 11,
        paddingInline: asset ? undefined : 24,
        minWidth: 'fit-content',
      }}
      gap={0}
      size={SelectButtonSize.Lg}
      alignItems={AlignItems.center}
      descriptionProps={{
        // variant: TextVariant.BodyMd,
        overflowWrap: OverflowWrap.BreakWord,
        ellipsis: false,
      }}
      caretIconProps={{
        // name: IconName.Arrow2Down,
        name: '',
        style: { display: Display.None },
      }}
      label={
        // <Text variant={TextVariant.BodyLgMedium} ellipsis>
        asset.symbol // </Text>
      }
      startAccessory={
        asset ? (
          <BadgeWrapper
            // marginRight={2}
            badge={
              asset ? (
                <AvatarNetwork
                  name={network?.name ?? ''}
                  src={getImageForChainId(
                    isNonEvmChainId(asset.chainId)
                      ? formatChainIdToCaip(asset.chainId)
                      : formatChainIdToHex(asset.chainId),
                  )}
                  size={AvatarNetworkSize.Xs}
                />
              ) : undefined
            }
          >
            {asset ? (
              <AvatarToken
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                src={asset.image}
                // backgroundColor={BackgroundColor.backgroundHover}
                name={asset.symbol}
              />
            ) : undefined}
          </BadgeWrapper>
        ) : undefined
      }
      {...props}
    />
  );
};
