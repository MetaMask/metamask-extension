import React from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  ALIGN_ITEMS,
  BORDER_RADIUS,
  BORDER_STYLE,
  COLORS,
  SIZES,
  TEXT,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import { Icon, Text } from '../../../component-library';

export type SnapDelineatorProps = {
  snapName: string;
  children: React.ReactNode;
};

export const SnapDelineator = ({ snapName, children }: SnapDelineatorProps) => {
  const t = useI18nContext();

  return (
    <Box
      className="snap-delineator__wrapper"
      borderStyle={BORDER_STYLE.SOLID}
      borderColor={COLORS.BORDER_MUTED}
      borderRadius={BORDER_RADIUS.LG}
    >
      <Box
        className="snap-delineator__header"
        alignItems={ALIGN_ITEMS.CENTER}
        backgroundColor={COLORS.INFO_MUTED}
        paddingLeft={2}
        paddingRight={2}
        paddingTop={1}
        paddingBottom={1}
      >
        <Icon name="snaps-filled" color={COLORS.INFO_DEFAULT} size={SIZES.SM} />
        <Text
          variant={TEXT.BODY_SM}
          color={COLORS.INFO_DEFAULT}
          className="snap-delineator__header__text"
          marginLeft={1}
          marginTop={0}
          marginBottom={0}
        >
          {t('contentFromSnap', [snapName])}
        </Text>
      </Box>
      <Box className="snap-delineator__content" padding={4}>
        {children}
      </Box>
    </Box>
  );
};
