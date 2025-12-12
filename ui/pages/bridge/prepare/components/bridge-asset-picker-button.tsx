import React from 'react';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../../shared/constants/bridge';
import {
  SelectButtonProps,
  SelectButtonSize,
} from '../../../../components/component-library/select-button/select-button.types';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  IconName,
  SelectButton,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  OverflowWrap,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { AssetPicker } from '../../../../components/multichain/asset-picker-amount/asset-picker';
import { type BridgeToken } from '../../../../ducks/bridge/types';
import { getImageUrlFromAssetId } from '../../utils/tokens';

export const BridgeAssetPickerButton = ({
  asset,
  networkProps,
  networkImageSrc,
  ...props
}: {
  asset?: BridgeToken;
  networkImageSrc?: string;
} & SelectButtonProps<'div'> &
  Pick<React.ComponentProps<typeof AssetPicker>, 'networkProps'>) => {
  const t = useI18nContext();

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
        variant: TextVariant.bodyMd,
        overflowWrap: OverflowWrap.BreakWord,
        ellipsis: false,
      }}
      caretIconProps={{
        name: IconName.Arrow2Down,
        style: { display: Display.None },
      }}
      label={
        <Text variant={TextVariant.bodyLgMedium} ellipsis>
          {asset?.symbol ?? t('bridgeTo')}
        </Text>
      }
      startAccessory={
        asset ? (
          <BadgeWrapper
            marginRight={2}
            badge={
              asset ? (
                <AvatarNetwork
                  name={NETWORK_TO_SHORT_NETWORK_NAME_MAP[asset.chainId]}
                  src={networkImageSrc}
                  size={AvatarNetworkSize.Xs}
                />
              ) : undefined
            }
          >
            {asset ? (
              <AvatarToken
                src={asset.image || getImageUrlFromAssetId(asset.assetId)}
                backgroundColor={BackgroundColor.backgroundHover}
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
