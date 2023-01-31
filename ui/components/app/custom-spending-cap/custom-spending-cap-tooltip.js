import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../ui/box';
import Typography from '../../ui/typography';
import Tooltip from '../../ui/tooltip';
import {
  COLORS,
  DISPLAY,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';

export const CustomSpendingCapTooltip = ({
  tooltipContentText,
  tooltipIcon,
}) => (
  <Box display={DISPLAY.INLINE_BLOCK}>
    <Tooltip
      interactive
      position="top"
      html={
        <Typography
          variant={TYPOGRAPHY.H7}
          margin={3}
          color={COLORS.TEXT_ALTERNATIVE}
          className="form-field__heading-title__tooltip"
        >
          {tooltipContentText}
        </Typography>
      }
    >
      {tooltipIcon ? (
        <i className="fa fa-exclamation-triangle form-field__heading-title__tooltip__warning-icon" />
      ) : (
        tooltipIcon !== '' && <i className="fa fa-question-circle" />
      )}
    </Tooltip>
  </Box>
);

CustomSpendingCapTooltip.propTypes = {
  tooltipContentText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  tooltipIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
};
