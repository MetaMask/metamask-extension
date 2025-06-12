import React from 'react';

import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  FontWeight,
  OverflowWrap,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getNftImage } from '../../../../helpers/utils/nfts';
import { getImageForChainId } from '../../../../selectors/multichain';
import {
  SelectButtonProps,
  SelectButtonSize,
} from '../../../component-library/select-button/select-button.types';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  Button,
  ButtonSize,
  IconName,
  SelectButton,
  Text,
} from '../../../component-library';
import { AssetPicker } from '.';

export const BridgeAssetPickerButton = ({
  asset,
  networkProps,
  action,
  onClick,
  ...props
}: { onClick: () => void } & SelectButtonProps<'div'> &
  Pick<
    React.ComponentProps<typeof AssetPicker>,
    'asset' | 'networkProps' | 'action'
  >) => {
  const t = useI18nContext();

  return asset ? (
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
                  name={networkProps?.network?.name ?? ''}
                  src={
                    networkProps?.network?.chainId
                      ? getImageForChainId(networkProps?.network?.chainId)
                      : undefined
                  }
                  size={AvatarNetworkSize.Xs}
                />
              ) : undefined
            }
          >
            {asset ? (
              <AvatarToken
                src={getNftImage(asset.image)}
                backgroundColor={BackgroundColor.backgroundHover}
                name={asset.symbol}
              />
            ) : undefined}
          </BadgeWrapper>
        ) : undefined
      }
      onClick={onClick}
      {...props}
    />
  ) : (
    <Button
      data-testid={props['data-testid']}
      size={ButtonSize.Lg}
      paddingLeft={6}
      paddingRight={6}
      fontWeight={FontWeight.Normal}
      style={{ whiteSpace: 'nowrap' }}
      onClick={onClick}
    >
      {action === 'bridge' ? t('bridgeTo') : t('swapSwapTo')}
    </Button>
  );
};
