import { blo } from 'blo';
import PropTypes from 'prop-types';
import React from 'react';

const BlockieIdenticon = ({ address, diameter, alt = '', borderRadius }) => {
  return (
    <img
      src={blo(address)}
      height={diameter}
      width={diameter}
      style={{
        borderRadius,
      }}
      alt={alt}
    />
  );
};

BlockieIdenticon.propTypes = {
  address: PropTypes.string.isRequired,
  diameter: PropTypes.number.isRequired,
  alt: PropTypes.string,
  borderRadius: PropTypes.string,
};

export default BlockieIdenticon;
