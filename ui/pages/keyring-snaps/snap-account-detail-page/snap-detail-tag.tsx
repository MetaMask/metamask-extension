import React, { ReactChildren } from 'react';
import {
  Box,
  Icon,
  IconName,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

const SnapDetailTag = ({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactChildren;
}) => {
  return (
    <Box
      className="mm-tag"
      backgroundColor={BackgroundColor.infoMuted}
      borderColor={BorderColor.infoMuted}
      borderWidth={1}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      paddingLeft={1}
      paddingRight={1}
      marginRight={1}
      borderRadius={BorderRadius.pill}
      display={Display.Flex}
    >
      <Icon name={icon} color={IconColor.infoDefault} />{' '}
      <Text color={TextColor.infoDefault} variant={TextVariant.bodySm}>
        {children}
      </Text>
    </Box>
  );
};

export default React.memo(SnapDetailTag);
