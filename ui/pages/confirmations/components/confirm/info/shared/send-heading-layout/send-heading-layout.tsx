import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';

type SendHeadingLayoutProps = {
  children: React.ReactNode;
  image: React.ReactNode;
};

const SendHeadingLayout = ({ children, image }: SendHeadingLayoutProps) => {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      paddingBottom={3}
      paddingHorizontal={0}
      marginBottom={2}
    >
      <Box marginBottom={1}>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('confirmTitleSending')}
        </Text>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Box flexDirection={BoxFlexDirection.Column}>{children}</Box>
        {image}
      </Box>
    </Box>
  );
};

export default SendHeadingLayout;
