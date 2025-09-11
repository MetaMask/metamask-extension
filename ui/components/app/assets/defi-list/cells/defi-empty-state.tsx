import React, { FC } from 'react';
import { Box, Text } from '../../../../component-library';
import {
  Display,
  JustifyContent,
  AlignItems,
  FlexDirection,
  TextColor,
  TextVariant,
  TextAlign,
} from '../../../../../helpers/constants/design-system';

export const DeFiEmptyStateMessage: FC<{
  primaryText: string;
  secondaryText: string;
}> = ({ primaryText, secondaryText }) => {
  return (
    <Box
      paddingTop={6}
      marginTop={12}
      marginBottom={12}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
      className="nfts-tab__link"
    >
      <Text
        color={TextColor.textAlternative}
        variant={TextVariant.bodyMdMedium}
        textAlign={TextAlign.Center}
        data-testid="defi-tab-no-positions"
      >
        {primaryText}
      </Text>
      <Text
        color={TextColor.textAlternative}
        variant={TextVariant.bodyMdMedium}
        textAlign={TextAlign.Center}
      >
        {secondaryText}
      </Text>
    </Box>
  );
};
