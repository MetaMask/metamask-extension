import React from 'react';
import PropTypes from 'prop-types';

import { SnapHomeRenderer } from '../../../components/app/snaps/snap-home-page/snap-home-renderer';
import { Box } from '../../../components/component-library';

function SnapHome({ snapId }) {
  return (
    <Box>
      <SnapHomeRenderer snapId={snapId} />
    </Box>
  );
}

SnapHome.propTypes = {
  snapId: PropTypes.string.isRequired,
};

export default SnapHome;
