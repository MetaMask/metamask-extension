import React from 'react';
import {
  BlockSize,
  Display,
  JustifyContent,
  AlignItems,
  FlexDirection,
  TextVariant,
  TextAlign,
} from '../../../../../helpers/constants/design-system';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';

export function DeFiErrorMessage({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <Box
      height={BlockSize.Full}
      width={BlockSize.Full}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
      gap={2}
      data-testid="defi-tab-error-message"
    >
      <Icon name={IconName.Warning} size={IconSize.Xl} />
      <Text variant={TextVariant.headingSm}>{title}</Text>
      <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
        {text}
      </Text>
    </Box>
  );
}
