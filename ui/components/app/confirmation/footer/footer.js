import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';

const Footer = ({
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  onCancel,
  onConfirm,
}) => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      gap={4}
      padding={4}
      width={BlockSize.full}
    >
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Lg}
        width={BlockSize.SixTwelfths}
        onClick={onCancel}
      >
        {cancelText}
      </Button>
      <Button
        size={ButtonSize.Lg}
        width={BlockSize.SixTwelfths}
        onClick={onConfirm}
      >
        {confirmText}
      </Button>
    </Box>
  );
};

Footer.propTypes = {
  cancelText: PropTypes.string,
  confirmText: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default Footer;
