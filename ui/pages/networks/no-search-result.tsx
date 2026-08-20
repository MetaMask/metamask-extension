import React from 'react';
import {
  Box,
  FontWeight,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { ThemeType } from '../../../shared/constants/preferences';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useTheme } from '../../hooks/useTheme';

type NoSearchResultProps = {
  dataTestId?: string;
};

export const NoSearchResult = ({
  dataTestId = 'networks-page-no-results',
}: NoSearchResultProps) => {
  const t = useI18nContext();
  const theme = useTheme();
  const activityIcon =
    theme === ThemeType.dark
      ? './images/empty-state-activity-dark.png'
      : './images/empty-state-activity-light.png';

  return (
    <Box
      className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
      data-testid={dataTestId}
    >
      <img
        src={activityIcon}
        alt={t('settingsSearchMatchingNotFound')}
        width={72}
        height={72}
      />
      <Text
        variant={TextVariant.BodyLg}
        fontWeight={FontWeight.Medium}
        className="text-text-alternative"
      >
        {t('settingsSearchMatchingNotFound')}
      </Text>
    </Box>
  );
};
