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
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import {
  AvatarIcon,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import {
  DelineatorType,
  getDelineatorTitle,
} from '../../../../helpers/constants/snaps';

export const SnapDelineator = ({
  snapName,
  type = DelineatorType.default,
  isCollapsable = false,
  isCollapsed = true,
  children,
  onClick,
  boxProps,
}) => {
  const t = useI18nContext();
  const isError =
    type === DelineatorType.Error || type === DelineatorType.Warning;

  return (
    <Box
      className="snap-delineator__wrapper"
      borderStyle={BorderStyle.solid}
      borderColor={BorderColor.borderDefault}
      borderRadius={BorderRadius.LG}
      backgroundColor={
        isError ? BackgroundColor.errorMuted : BackgroundColor.backgroundDefault
      }
      {...boxProps}
    >
      <Box
        className="snap-delineator__header"
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        padding={1}
        borderWidth={isCollapsed ? [1, 1, 0, 1] : 1}
      >
        <Box display={Display.Flex} alignItems={AlignItems.center}>
          <AvatarIcon
            iconName={IconName.Snaps}
            size={IconSize.Xs}
            backgroundColor={
              isError ? IconColor.errorDefault : IconColor.infoDefault
            }
            iconProps={{
              size: IconSize.Xs,
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
        {isCollapsable && (
          <Icon
            name={isCollapsed ? IconName.ArrowDown : IconName.ArrowUp}
            size={IconSize.Sm}
            color={IconColor.iconMuted}
            className="snap-delineator__expansion-icon"
            onClick={onClick}
          />
        )}
      </Box>
      <Box
        className="snap-delineator__content"
        padding={4}
        display={isCollapsable && isCollapsed ? Display.None : Display.Block}
      >
        {children}
      </Box>
    </Box>
  );
};

SnapDelineator.propTypes = {
  snapName: PropTypes.string,
  type: PropTypes.string,
  children: PropTypes.ReactNode,
  isCollapsable: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  onClick: PropTypes.func,
  boxProps: PropTypes.object,
};
