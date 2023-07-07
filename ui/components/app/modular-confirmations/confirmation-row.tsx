import React from 'react';
import { Box, Text } from '../../component-library';
import {
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

export type ConfirmationRowProps = {
  label: string;
  children: React.ReactNode | string;
};

export const ConfirmationRow = ({ label, children }: ConfirmationRowProps) => (
  <Box
    display={Display.Flex}
    flexDirection={FlexDirection.Row}
    justifyContent={JustifyContent.spaceBetween}
    flexWrap={FlexWrap.Wrap}
    marginTop={2}
    marginBottom={2}
  >
    <Text variant={TextVariant.bodyMdMedium} color={TextColor.textAlternative}>
      {label}
    </Text>
    {typeof children === 'string' ? <Text>{children}</Text> : children}
  </Box>
);
