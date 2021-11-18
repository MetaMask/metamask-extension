import React from 'react';
import PropTypes from 'prop-types';
import Chip from '../../../ui/chip';
import Box from '../../../ui/box';
import NpmIcon from '../../../ui/icon/npm-icon';
import { COLORS } from '../../../../helpers/constants/design-system';

const SnapsAuthorshipPill = ({ packageName }) => {
  return (
    <Chip
      leftIcon={
        <Box paddingLeft={2}>
          <NpmIcon />
        </Box>
      }
      label={packageName}
      backgroundColor={COLORS.UI1}
    />
  );
};

SnapsAuthorshipPill.propTypes = {
  /**
   * NPM package name of the snap
   */
  packageName: PropTypes.string,
};

export default SnapsAuthorshipPill;
