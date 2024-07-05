import React from 'react';
import { Box } from '../../../../component-library';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';

export type ConfirmInfoSectionProps = {
  children: React.ReactNode | string;
  noPadding?: boolean;
};

export const ConfirmInfoSection = ({
  children,
  noPadding,
}: ConfirmInfoSectionProps) => {
  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.MD}
      padding={noPadding ? 0 : 2}
      marginBottom={4}
    >
      {children}
    </Box>
  );
};
