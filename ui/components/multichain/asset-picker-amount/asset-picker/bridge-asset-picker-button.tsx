import React from 'react';
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
import { ERC20Asset, NativeAsset } from '../asset-picker-modal/types';

export const BridgeAssetPickerButton = ({
  asset,
  networkName,
  networkImageSrc,
  action,
  onClick,
  dataTestId,
  ...props
}: {
  networkImageSrc?: string;
  action?: 'bridge' | 'swap';
  asset?: NativeAsset | ERC20Asset;
  networkName?: string;
  onClick: () => void;
  dataTestId?: string;
} & SelectButtonProps<'div'>) => {
  const t = useI18nContext();

  return asset ? (
    <SelectButton
      onClick={onClick}
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
                  name={networkName ?? ''}
                  src={networkImageSrc}
                  size={AvatarNetworkSize.Xs}
                />
              ) : undefined
            }
          >
            {asset ? (
              <AvatarToken
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                src={getNftImage(asset.image) || undefined}
                backgroundColor={BackgroundColor.backgroundHover}
                name={asset.symbol}
              />
            ) : undefined}
          </BadgeWrapper>
        ) : undefined
      }
      data-testid={dataTestId}
      {...props}
    />
  ) : (
    <Button
      onClick={onClick}
      size={ButtonSize.Lg}
      paddingLeft={6}
      paddingRight={6}
      fontWeight={FontWeight.Normal}
      style={{ whiteSpace: 'nowrap' }}
      data-testid={dataTestId}
    >
      {action === 'swap' ? t('swapSwapTo') : t('bridgeTo')}
    </Button>
  );
};
