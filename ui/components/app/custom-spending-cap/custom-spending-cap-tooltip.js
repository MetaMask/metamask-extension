import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../../ui/tooltip';
import {
  TextColor,
  TextVariant,
  Display,
  AlignItems,
  IconColor,
} from '../../../helpers/constants/design-system';

import { Icon, IconName, IconSize, Text, Box } from '../../component-library';

export const CustomSpendingCapTooltip = ({
  tooltipContentText,
  tooltipIcon,
}) => (
  <Box display={Display.InlineFlex} alignItems={AlignItems.center}>
    <Tooltip
      interactive
      position="top"
      html={
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
          {tooltipContentText}
        </Text>
      }
    >
      {tooltipIcon ? (
        <Icon
          name={IconName.Danger}
          size={IconSize.Inherit}
          color={IconColor.errorDefault}
        />
      ) : (
        tooltipIcon !== '' && (
          <Icon
            name={IconName.Question}
            size={IconSize.Inherit}
            color={IconColor.iconAlternative}
          />
        )
      )}
    </Tooltip>
  </Box>
);

CustomSpendingCapTooltip.propTypes = {
  tooltipContentText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  tooltipIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
};
