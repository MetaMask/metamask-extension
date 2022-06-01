import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Chip from '../../../ui/chip';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import {
  COLORS,
  TYPOGRAPHY,
  TEXT_ALIGN,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const snapIdPrefixes = ['npm:', 'local:'];

const SnapsAuthorshipPill = ({ snapId, version, className }) => {
  // @todo Use getSnapPrefix from snaps-skunkworks when possible
  const snapPrefix = snapIdPrefixes.find((prefix) => snapId.startsWith(prefix));
  const packageName = snapId.replace(snapPrefix, '');
  const isNPM = snapPrefix === 'npm:';
  const url = isNPM
    ? `https://www.npmjs.com/package/${packageName}`
    : packageName;
  const icon = isNPM ? 'fab fa-npm fa-lg' : 'fas fa-code';
  const t = useI18nContext();
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
            <i className={`${icon} snaps-authorship-icon`} />
          </Box>
        }
        rightIcon={
          version && (
            <Box
              className="snaps-authorship-version"
              backgroundColor={COLORS.PRIMARY_DEFAULT}
              paddingLeft={2}
              paddingRight={2}
            >
              <Typography
                color={COLORS.PRIMARY_INVERSE}
                variant={TYPOGRAPHY.H7}
                align={TEXT_ALIGN.CENTER}
                tag="span"
                className="version"
              >
                {t('shorthandVersion', [version])}
              </Typography>
            </Box>
          )
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
   * The id of the snap
   */
  snapId: PropTypes.string,
  /**
   * The version of the snap
   */
  version: PropTypes.string,
  /**
   * The className of the SnapsAuthorshipPill
   */
  className: PropTypes.string,
};

export default SnapsAuthorshipPill;
