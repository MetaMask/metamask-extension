import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '../../../../component-library';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';

import type { StyleUtilityProps } from '../../../../component-library/box';

interface ConfirmInfoProps extends StyleUtilityProps {
  children: React.ReactNode | React.ReactNode[];
}

export const ConfirmInfo: React.FC<ConfirmInfoProps> = ({
  children,
  ...props
}) => {
  return (
    <Box
      className="confirm-info"
      borderRadius={BorderRadius.LG}
      backgroundColor={BackgroundColor.backgroundDefault}
      {...props}
    >
      {children}
    </Box>
  );
};

ConfirmInfo.propTypes = {
  children: PropTypes.node,
};
