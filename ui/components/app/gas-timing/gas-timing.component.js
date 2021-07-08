import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Typography from '../../ui/typography/typography';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';
import InfoTooltip from '../../ui/info-tooltip';

export default function GasTiming({ text, tooltipText, attitude }) {
  return (
    <Typography
      variant={TYPOGRAPHY.H7}
      className={classNames('gas-timing', {
        [`gas-timing--${attitude}`]: attitude,
      })}
    >
      {text}
      {tooltipText && <InfoTooltip position="top" contentText={tooltipText} />}
    </Typography>
  );
}

GasTiming.propTypes = {
  text: PropTypes.string.isRequired,
  tooltipText: PropTypes.string,
  attitude: PropTypes.oneOf(['positive', 'negative', 'warning', '']),
};

GasTiming.defaultProps = {
  tooltipText: '',
  attitude: '',
};
