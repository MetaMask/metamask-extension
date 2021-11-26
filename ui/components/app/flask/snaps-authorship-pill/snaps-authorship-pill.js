import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Chip from '../../../ui/chip';
import Box from '../../../ui/box';
import NpmIcon from '../icons/npm-icon';
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
      className={classnames(className, `snaps-authorship-pill`)}
      backgroundColor={COLORS.WHITE}
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
