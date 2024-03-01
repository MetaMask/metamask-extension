import React from 'react';
import type { FC } from 'react';

import { NotificationDetail } from '../notification-detail';
import {
  AvatarTokenSize,
  AvatarToken,
  BadgeWrapper,
  BadgeWrapperPosition,
  Text,
} from '../../component-library';
import {
  BackgroundColor,
  BorderColor,
  FontWeight,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';

interface BadgeProps {
  src: string;
  position?: BadgeWrapperPosition;
}

interface IconProps {
  src: string;
  badge?: BadgeProps;
}

export interface NotificationDetailAssetProps {
  icon: IconProps;
  label: string;
  detail: string;
  fiatValue?: string;
  value?: string;
}

const createTextComponent = (
  variant: TextVariant,
  fontWeight: FontWeight,
  color: TextColor,
  children: string,
) => (
  <Text variant={variant} fontWeight={fontWeight} color={color}>
    {children}
  </Text>
);

/**
 * A component to display a notification detail with an asset.
 * The asset includes an icon, a label, a detail, a fiat value, and a value.
 *
 * @param props - The component props.
 * @param props.icon - The tokem icon to display with a badge.
 * @param props.label - The label to display.
 * @param props.detail - The detail to display.
 * @param props.fiatValue - The fiat value to display.
 * @param props.value - The value to display.
 * @returns The rendered component.
 */
export const NotificationDetailAsset: FC<NotificationDetailAssetProps> = ({
  icon,
  label,
  detail,
  fiatValue,
  value,
}): JSX.Element => {
  const badgeIcon = (
    <AvatarToken
      src={icon.badge?.src}
      size={AvatarTokenSize.Sm}
      backgroundColor={BackgroundColor.infoDefault}
      borderColor={BorderColor.backgroundDefault}
      borderWidth={2}
    />
  );

  const badgeWrapper = icon.badge ? (
    <BadgeWrapper
      position={icon.badge.position || BadgeWrapperPosition.topRight}
      badge={badgeIcon}
    >
      <AvatarToken src={icon.src} />
    </BadgeWrapper>
  ) : (
    <AvatarToken src={icon.src} />
  );

  const primaryTextLeft = createTextComponent(
    TextVariant.bodyLgMedium,
    FontWeight.Medium,
    TextColor.textDefault,
    label,
  );
  const secondaryTextLeft = createTextComponent(
    TextVariant.bodyMd,
    FontWeight.Normal,
    TextColor.textAlternative,
    detail,
  );
  const primaryTextRight = value
    ? createTextComponent(
        TextVariant.bodyLgMedium,
        FontWeight.Medium,
        TextColor.textDefault,
        value,
      )
    : undefined;
  const secondaryTextRight = fiatValue
    ? createTextComponent(
        TextVariant.bodyMd,
        FontWeight.Normal,
        TextColor.textAlternative,
        fiatValue,
      )
    : undefined;

  return (
    <NotificationDetail
      icon={badgeWrapper}
      primaryTextLeft={primaryTextLeft}
      secondaryTextLeft={secondaryTextLeft}
      primaryTextRight={primaryTextRight}
      secondaryTextRight={secondaryTextRight}
    />
  );
};
