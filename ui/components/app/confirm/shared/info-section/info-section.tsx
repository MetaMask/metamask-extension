import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '../../../../component-library';
import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';

interface ConfirmInfoSectionProps {
  children: React.ReactNode | React.ReactNode[];
}

export const ConfirmInfoSection: React.FC<ConfirmInfoSectionProps> = ({
  children,
  ...props
}) => {
  return (
    <Box
      className="confirm-info-section"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      padding={4}
      {...props}
    >
      {children}
    </Box>
  );
};

ConfirmInfoSection.propTypes = {
  children: PropTypes.node,
};
