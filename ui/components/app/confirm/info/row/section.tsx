import React, { CSSProperties } from 'react';
import { Box } from '../../../../component-library';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';

export type ConfirmInfoSectionProps = {
  children: React.ReactNode | string;
  noPadding?: boolean;
  style?: CSSProperties;
  'data-testid'?: string;
};

export const ConfirmInfoSection = ({
  children,
  noPadding,
  style = {},
  'data-testid': dataTestId,
}: ConfirmInfoSectionProps) => {
  return (
    <Box
      data-testid={dataTestId}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.MD}
      padding={noPadding ? 0 : 2}
      marginBottom={4}
      style={style}
    >
      {children}
    </Box>
  );
};
