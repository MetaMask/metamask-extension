import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../ui/box';
import Typography from '../../ui/typography';
import Tooltip from '../../ui/tooltip';
import {
  TextColor,
  DISPLAY,
  TypographyVariant,
} from '../../../helpers/constants/design-system';
import { Icon, ICON_NAMES, ICON_SIZES } from '../../component-library';

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
          variant={TypographyVariant.H7}
          margin={3}
          color={TextColor.textAlternative}
          className="form-field__heading-title__tooltip"
        >
          {tooltipContentText}
        </Typography>
      }
    >
      {tooltipIcon ? (
        <Icon
          name={ICON_NAMES.DANGER}
          className="form-field__heading-title__tooltip__warning-icon"
          size={ICON_SIZES.AUTO}
          style={{ 'vertical-align': 'bottom' }}
        />
      ) : (
        tooltipIcon !== '' && <Icon name={ICON_NAMES.QUESTION} />
      )}
    </Tooltip>
  </Box>
);

CustomSpendingCapTooltip.propTypes = {
  tooltipContentText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  tooltipIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
};
