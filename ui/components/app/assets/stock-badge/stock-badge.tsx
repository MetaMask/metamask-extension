import React from 'react';
import type { BridgeToken } from '../../../../ducks/bridge/types';
import { IconName, Tag } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useRWAToken } from '../../../../pages/bridge/hooks/useRWAToken';

type StockBadgeProps = {
  rwaData: Pick<BridgeToken, 'rwaData'>['rwaData'];
};

export const StockBadge = ({ rwaData }: StockBadgeProps) => {
  const t = useI18nContext();
  const { isTokenTradingOpen } = useRWAToken();
  const isMarketClosed = !isTokenTradingOpen({ rwaData });

  return (
    <Tag
      label={t('tokenStock')}
      {...(isMarketClosed ? { startIconName: IconName.Clock } : {})}
    />
  );
};
