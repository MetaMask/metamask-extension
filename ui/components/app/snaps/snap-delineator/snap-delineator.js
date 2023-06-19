import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  BorderStyle,
  BorderColor,
  BorderRadius,
  AlignItems,
  BackgroundColor,
  IconColor,
  TextVariant,
  TextColor,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import {
  AvatarIcon,
  Text,
  IconName,
  IconSize,
} from '../../../component-library';
import {
  DelineatorType,
  getDelineatorTitle,
} from '../../../../helpers/constants/snaps';

export const SnapDelineator = ({
  snapName,
  type = DelineatorType.default,
  children,
}) => {
  const t = useI18nContext();
  const isError = type === DelineatorType.Error;
  return (
    <Box
      className="snap-delineator__wrapper"
      borderStyle={BorderStyle.solid}
      borderColor={BorderColor.borderDefault}
      borderRadius={BorderRadius.LG}
      backgroundColor={
        isError ? BackgroundColor.errorMuted : BackgroundColor.backgroundDefault
      }
    >
      <Box
        className="snap-delineator__header"
        alignItems={AlignItems.center}
        padding={1}
      >
        <AvatarIcon
          iconName={IconName.Snaps}
          size={IconSize.Sm}
          backgroundColor={
            isError ? IconColor.errorDefault : IconColor.infoDefault
          }
          borderColor={BackgroundColor.backgroundDefault}
          borderWidth={2}
          iconProps={{
            size: IconSize.Sm,
            color: IconColor.infoInverse,
          }}
        />
        <Text
          variant={TextVariant.bodySm}
          color={isError ? TextColor.errorDefault : TextColor.textAlternative}
          className="snap-delineator__header__text"
          marginLeft={1}
          marginTop={0}
          marginBottom={0}
        >
          {t(getDelineatorTitle(type), [snapName])}
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
  type: PropTypes.string,
  children: PropTypes.ReactNode,
};
