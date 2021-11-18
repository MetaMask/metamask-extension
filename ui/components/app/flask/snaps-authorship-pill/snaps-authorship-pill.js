import React from 'react';
import PropTypes from 'prop-types';
import Chip from '../../../ui/chip';
import Box from '../../../ui/box';
import NpmIcon from '../../../ui/icon/npm-icon';
import Typography from '../../../ui/typography';
import {
  COLORS,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';

const SnapsAuthorshipPill = ({ packageName, className }) => {
  return (
    <Chip
      leftIcon={
        <Box paddingLeft={2}>
          <NpmIcon />
        </Box>
      }
      className={className}
      backgroundColor={COLORS.UI1}
    >
      <Typography
        className="chip__label"
        variant={TYPOGRAPHY.H7}
        tag="span"
        color={COLORS.UI4}
      >
        {packageName}
      </Typography>
    </Chip>
  );
};

SnapsAuthorshipPill.propTypes = {
  /**
   * NPM package name of the snap
   */
  packageName: PropTypes.string,
  /**
   * The className of the SnapsAuthorshipPill
   */
  className: PropTypes.string,
};

export default SnapsAuthorshipPill;
