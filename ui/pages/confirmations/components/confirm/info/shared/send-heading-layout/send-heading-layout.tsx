import React from 'react';
import { Box, Text } from '../../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';

interface SendHeadingLayoutProps {
  children: React.ReactNode;
  image: React.ReactNode;
}

const SendHeadingLayout = ({ children, image }: SendHeadingLayoutProps) => {
  const t = useI18nContext();

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      paddingBottom={3}
      paddingInline={0}
      marginBottom={2}
    >
      <Text
        variant={TextVariant.bodyMd}
        color={TextColor.textAlternative}
        marginBottom={1}
      >
        {t('confirmTitleSending')}
      </Text>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
      >
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          {children}
        </Box>
        {image}
      </Box>
    </Box>
  );
};

export default SendHeadingLayout;
