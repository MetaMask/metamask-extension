import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Chip from '../../../ui/chip';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import {
  COLORS,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';

const SnapsAuthorshipPill = ({ packageName, className, url }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={classnames(className, `snaps-authorship-pill`)}
    >
      <Chip
        leftIcon={
          <Box paddingLeft={2}>
            <i className="fab fa-npm fa-lg snaps-authorship-icon" />
          </Box>
        }
        backgroundColor={COLORS.BACKGROUND_DEFAULT}
      >
        <Typography
          className="chip__label"
          variant={TYPOGRAPHY.H7}
          tag="span"
          color={COLORS.TEXT_ALTERNATIVE}
        >
          {packageName}
        </Typography>
      </Chip>
    </a>
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
  /**
   * The url of the snap's package
   */
  url: PropTypes.string,
};

export default SnapsAuthorshipPill;
