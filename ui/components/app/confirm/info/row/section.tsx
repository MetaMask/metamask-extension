import React, { CSSProperties } from 'react';
import { Box } from '../../../../component-library';
import type { SizeNumber } from '../../../../component-library/box/box.types';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';

export type ConfirmInfoSectionProps = {
  children: React.ReactNode | string;
  marginBottom?: SizeNumber;
  noPadding?: boolean;
  style?: CSSProperties;
  'data-testid'?: string;
};

export const ConfirmInfoSection = ({
  children,
  marginBottom = 4,
  noPadding,
  style = {},
  'data-testid': dataTestId,
}: ConfirmInfoSectionProps) => {
  return (
    <Box
      data-testid={dataTestId}
      backgroundColor={BackgroundColor.backgroundSection}
      borderRadius={BorderRadius.LG}
      paddingInline={noPadding ? 0 : 2}
      paddingTop={noPadding ? 0 : 1}
      paddingBottom={noPadding ? 0 : 1}
      marginBottom={marginBottom}
      style={style}
    >
      {children}
    </Box>
  );
};
