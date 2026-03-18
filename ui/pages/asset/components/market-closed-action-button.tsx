import React from 'react';
import {
  Button,
  ButtonVariant,
  IconName,
} from '../../../components/component-library';
import { BlockSize } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

type MarketClosedActionButtonProps = {
  onClick: () => void;
};

export const MarketClosedActionButton = ({
  onClick,
}: MarketClosedActionButtonProps) => {
  const t = useI18nContext();

  return (
    <Button
      width={BlockSize.Full}
      variant={ButtonVariant.Secondary}
      startIconName={IconName.Clock}
      endIconName={IconName.Info}
      onClick={onClick}
      data-testid="market-closed-action-button"
    >
      {t('bridgeMarketClosedAction')}
    </Button>
  );
};
