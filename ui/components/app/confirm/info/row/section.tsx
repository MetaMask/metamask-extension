import React from 'react';
import { Box } from '../../../../component-library';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';

export type ConfirmInfoSectionProps = {
  children: React.ReactNode | string;
  noPadding?: boolean;
  'data-testid'?: string;
};

export const ConfirmInfoSection = ({
  children,
  noPadding,
  'data-testid': dataTestId,
}: ConfirmInfoSectionProps) => {
  return (
    <Box
      data-testid={dataTestId}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.MD}
      padding={noPadding ? 0 : 2}
      marginBottom={4}
    >
      {children}
    </Box>
  );
};
