import React from 'react';
import { Button, ButtonVariant, IconName } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { JustifyContent } from '../../../helpers/constants/design-system';

type MarketClosedActionButtonProps = {
  onClick: () => void;
};

export const MarketClosedActionButton = ({
  onClick,
}: MarketClosedActionButtonProps) => {
  const t = useI18nContext();

  return (
    <Button
      isFullWidth
      variant={ButtonVariant.Secondary}
      startIconName={IconName.AfterHours}
      endIconName={IconName.Info}
      endIconProps={{
        style: {
          marginLeft: 'auto',
        },
      }}
      onClick={onClick}
      style={{
        justifyContent: JustifyContent.flexStart,
      }}
      data-testid="market-closed-action-button"
    >
      {t('bridgeMarketClosedAction')}
    </Button>
  );
};
