import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { getSnapPrefix } from '@metamask/snaps-utils';
import Chip from '../../../ui/chip';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import {
  TypographyVariant,
  TEXT_ALIGN,
  BackgroundColor,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getSnapName,
  removeSnapIdPrefix,
} from '../../../../helpers/utils/util';

const SnapsAuthorshipPill = ({ snapId, version, className }) => {
  // We're using optional chaining with snapId, because with the current implementation
  // of snap update in the snap controller, we do not have reference to snapId when an
  // update request is rejected because the reference comes from the request itself and not subject metadata
  // like it is done with snap install
  const snapPrefix = snapId && getSnapPrefix(snapId);
  const packageName = snapId && removeSnapIdPrefix(snapId);
  const isNPM = snapPrefix === 'npm:';
  const url = isNPM
    ? `https://www.npmjs.com/package/${packageName}`
    : packageName;
  const icon = isNPM ? 'fab fa-npm fa-lg' : 'fas fa-code';
  const t = useI18nContext();

  const friendlyName = getSnapName(snapId);

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
              backgroundColor={BackgroundColor.primaryDefault}
              paddingLeft={2}
              paddingRight={2}
            >
              <Typography
                color={TextColor.primaryInverse}
                variant={TypographyVariant.H7}
                align={TEXT_ALIGN.CENTER}
                as="span"
                className="version"
              >
                {t('shorthandVersion', [version])}
              </Typography>
            </Box>
          )
        }
        backgroundColor={BackgroundColor.backgroundDefault}
      >
        <Typography
          className="chip__label"
          variant={TypographyVariant.H7}
          as="span"
          color={TextColor.textAlternative}
          title={friendlyName}
        >
          {friendlyName}
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
