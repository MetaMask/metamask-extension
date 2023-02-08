import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  BorderStyle,
  Size,
  BorderColor,
  BorderRadius,
  AlignItems,
  BackgroundColor,
  IconColor,
  TextVariant,
  TextColor,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import { Icon, Text } from '../../../component-library';

export const SnapDelineator = ({ snapName, children }) => {
  const t = useI18nContext();

  return (
    <Box
      className="snap-delineator__wrapper"
      borderStyle={BorderStyle.solid}
      borderColor={BorderColor.borderMuted}
      borderRadius={BorderRadius.LG}
    >
      <Box
        className="snap-delineator__header"
        alignItems={AlignItems.center}
        backgroundColor={BackgroundColor.infoMuted}
        paddingLeft={2}
        paddingRight={2}
        paddingTop={1}
        paddingBottom={1}
      >
        <Icon name="snaps" color={IconColor.infoDefault} size={Size.SM} />
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.infoDefault}
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

SnapDelineator.propTypes = {
  snapName: PropTypes.string,
  children: PropTypes.ReactNode,
};
