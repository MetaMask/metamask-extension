import React from 'react';
import PropTypes from 'prop-types';

import Box from '../../../components/ui/box';

const PopoverCustomBackground = ({ onClose }) => {
  return <Box className="popover-custom-background" onClick={onClose}></Box>;
};

export default PopoverCustomBackground;

PopoverCustomBackground.propTypes = {
  onClose: PropTypes.func,
};
