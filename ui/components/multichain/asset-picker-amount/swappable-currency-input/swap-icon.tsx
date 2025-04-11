import React from 'react';

import {
  BackgroundColor,
  IconColor,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../component-library';

export default function SwapIcon({
  onClick,
}: {
  onClick: React.MouseEventHandler;
}) {
  const t = useI18nContext();

  return (
    <ButtonIcon
      backgroundColor={BackgroundColor.transparent}
      iconName={IconName.SwapVertical}
      size={ButtonIconSize.Sm}
      color={IconColor.primaryDefault}
      onClick={onClick}
      ariaLabel={t('switchInputCurrency')}
      className="asset-picker-amount__input__swap"
    />
  );
}
