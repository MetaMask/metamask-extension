import React from 'react';
import { IconName, Tag } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type StockBadgeProps = {
  isMarketClosed: boolean;
};

export const StockBadge = ({ isMarketClosed }: StockBadgeProps) => {
  const t = useI18nContext();

  return (
    <Tag
      label={t('tokenStock')}
      {...(isMarketClosed ? { startIconName: IconName.Clock } : {})}
    />
  );
};
