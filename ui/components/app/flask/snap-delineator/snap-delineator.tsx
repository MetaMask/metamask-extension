import React from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { COLORS } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import { Icon } from '../../../component-library';

export type SnapDelineatorProps = {
  snapName: string;
  children: React.ReactNode;
};

export const SnapDelineator = ({ snapName, children }: SnapDelineatorProps) => {
  const t = useI18nContext();

  return (
    <Box className="snap-delineator__wrapper">
      <Box
        className="snap-delineator__header"
        display="flex"
        alignItems="center"
      >
        <Icon name="snaps-filled" />
        <Typography
          className="snap-delineator__header__text"
          color={COLORS.INFO_DEFAULT}
          marginLeft={1}
          marginTop={0}
          marginBottom={0}
        >
          {t('contentFromSnap', [snapName])}
        </Typography>
      </Box>
      <Box className="snap-delineator__content">{children}</Box>
    </Box>
  );
};
