import React from 'react';
import { IconName, IconSize } from '@metamask/design-system-react';
import { Tag } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type StockBadgeProps = {
  isMarketClosed: boolean;
};

export const StockBadge = ({ isMarketClosed }: StockBadgeProps) => {
  const t = useI18nContext();

  return (
    <Tag
      label={t('tokenStock')}
      {...(isMarketClosed
        ? { iconName: IconName.AfterHours, iconSize: IconSize.Xs }
        : {})}
    />
  );
};
