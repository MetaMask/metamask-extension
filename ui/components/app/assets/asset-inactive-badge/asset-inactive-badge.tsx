import React from 'react';
import { TextColor, TextVariant } from '@metamask/design-system-react';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../helpers/constants/design-system';
import { Tag } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const AssetInactiveBadge = () => {
  const t = useI18nContext();

  return (
    <Tag
      label={t('assetInactive')}
      backgroundColor={BackgroundColor.warningMuted}
      borderRadius={BorderRadius.pill}
      labelProps={{ color: TextColor.WarningDefault as never }}
      textVariant={TextVariant.BodySm}
      data-testid="asset-inactive-badge"
    />
  );
};
