import type { CSSProperties } from 'react';
import React from 'react';

import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../component-library';

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
