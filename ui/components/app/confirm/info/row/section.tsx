import React from 'react';
import { Box } from '../../../../component-library';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';

export const ConfirmInfoSection = ({
  children,
}: {
  children: React.ReactNode | string;
}) => {
  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.MD}
      padding={2}
      marginBottom={4}
    >
      {children}
    </Box>
  );
};
