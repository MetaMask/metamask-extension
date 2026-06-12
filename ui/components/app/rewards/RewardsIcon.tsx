import React, { useState } from 'react';
import { Icon, IconName, IconSize } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export enum RewardsIconVariant {
  Default = 'default',
  Vip = 'vip',
  Alternative = 'alternative',
}

export const RewardsIcon = ({
  variant = RewardsIconVariant.Default,
  startIconName,
  size = 16,
}: {
  variant?: RewardsIconVariant;
  startIconName?: IconName;
  size?: number;
}) => {
  const t = useI18nContext();
  const [imageLoadError, setImageLoadError] = useState(false);

  if (startIconName) {
    return <Icon name={startIconName} size={IconSize.Sm} />;
  }

  if (imageLoadError) {
    return null;
  }

  const iconPath =
    variant === RewardsIconVariant.Default
      ? './images/metamask-rewards-points.svg'
      : `./images/metamask-rewards-points-${variant}.svg`;
  return (
    <img
      src={iconPath}
      alt={t('rewardsPointsIcon')}
      width={size}
      height={size}
      onError={() => setImageLoadError(true)}
    />
  );
};
