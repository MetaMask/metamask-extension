import React from 'react';
import { Box } from '../../../../component-library';
import {
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';

import type { StyleUtilityProps } from '../../../../component-library/box';

interface ConfirmInfoProps extends StyleUtilityProps {
  children: React.ReactNode | React.ReactNode[];
}

export const ConfirmInfoContainer: React.FC<ConfirmInfoProps> = ({
  children,
  ...props
}) => {
  return (
    <Box
      className="confirm-info-container"
      borderRadius={BorderRadius.LG}
      backgroundColor={BackgroundColor.backgroundDefault}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      {...props}
    >
      {children}
    </Box>
  );
};
