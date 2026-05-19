import React, { CSSProperties } from 'react';
import { Box, BoxBackgroundColor } from '@metamask/design-system-react';

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
      backgroundColor={BoxBackgroundColor.BackgroundSection}
      className="rounded-lg"
      paddingLeft={noPadding ? 0 : 2}
      paddingRight={noPadding ? 0 : 2}
      paddingTop={noPadding ? 0 : 1}
      paddingBottom={noPadding ? 0 : 1}
      marginBottom={4}
      style={style}
    >
      {children}
    </Box>
  );
};
