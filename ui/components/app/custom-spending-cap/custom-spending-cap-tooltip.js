import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../ui/box';
import Tooltip from '../../ui/tooltip';
import {
  TextColor,
  DISPLAY,
  TextVariant,
} from '../../../helpers/constants/design-system';

import { Icon, IconName, IconSize, Text } from '../../component-library';

export const CustomSpendingCapTooltip = ({
  tooltipContentText,
  tooltipIcon,
}) => (
  <Box display={DISPLAY.INLINE_BLOCK}>
    <Tooltip
      interactive
      position="top"
      html={
        <Text
          variant={TextVariant.bodySm}
          as="h6"
          margin={3}
          color={TextColor.textAlternative}
          className="form-field__heading-title__tooltip"
        >
          {tooltipContentText}
        </Text>
      }
    >
      {tooltipIcon ? (
        <Icon
          name={IconName.Danger}
          className="form-field__heading-title__tooltip__warning-icon"
          size={IconSize.Inherit}
          style={{ 'vertical-align': 'bottom' }}
        />
      ) : (
        tooltipIcon !== '' && (
          <Icon name={IconName.Question} size={IconSize.Inherit} />
        )
      )}
    </Tooltip>
  </Box>
);

CustomSpendingCapTooltip.propTypes = {
  tooltipContentText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  tooltipIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
};
