import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Card from '../../../ui/card';
import Box from '../../../ui/box';
import IconWithFallback from '../../../ui/icon-with-fallback';
import IconBorder from '../../../ui/icon-border';
import ToggleButton from '../../../ui/toggle-button';
import Chip from '../../../ui/chip';
import Button from '../../../ui/button';

import {
  Color,
  AlignItems,
  JustifyContent,
  DISPLAY,
  Size,
  BorderRadius,
} from '../../../../helpers/constants/design-system';
import { Icon, ICON_NAMES, ICON_SIZES, Text } from '../../../component-library';

const STATUSES = {
  INSTALLING: 'installing',
  RUNNING: 'running',
  STOPPED: 'stopped',
  CRASHED: 'crashed',
};

const SnapSettingsCard = ({
  name,
  icon,
  url,
  onClick,
  className,
  cardProps,
}) => {
  return (
    <Card
      className={classnames('snap-settings-card', className)}
      {...cardProps}
      onClick={onClick}
      borderRadius={BorderRadius.LG}
    >
      <Box
        display={DISPLAY.FLEX}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
      >
        {(icon || name) && (
          <Box>
            <IconBorder size={32}>
              <IconWithFallback icon={icon} size={32} name={name} />
            </IconBorder>
          </Box>
        )}
        <Box marginLeft={4}>
          <Text className="snap-settings-card__title" size={Size.MD}>
            {name}
          </Text>
          <Text
            className="snap-settings-card__url"
            color={Color.textMuted}
            size={Size.XXS}
          >
            {url}
          </Text>
        </Box>
        <Box marginLeft={4} className="snap-settings-card__caret">
          <Icon
            name={ICON_NAMES.ARROW_RIGHT}
            size={ICON_SIZES.LG}
            color={Color.textMuted}
          />
        </Box>
      </Box>
    </Card>
  );
};

SnapSettingsCard.propTypes = {
  /**
   * Name of the snap used for the title of the card and fallback letter for the snap icon
   */
  name: PropTypes.string,
  /**
   * Description of the snap. Truncates after 4 lines
   */
  description: PropTypes.string,
  /**
   * Image source of the snap icon for the IconWithFallback component
   */
  icon: PropTypes.string,
  /**
   * Date the snap was added. Date will need formatting
   */
  dateAdded: PropTypes.string,
  /**
   * The version of the snap in semver. Will truncate after 4 numbers e.g. 10.5.1...
   */
  version: PropTypes.string,
  /**
   * Url of the snap website
   */
  url: PropTypes.string,
  /**
   * The onChange function for the ToggleButton component
   */
  onToggle: PropTypes.func,
  /**
   * Whether the snap is enabled. `value` prop of the ToggleButton
   */
  isEnabled: PropTypes.bool,
  /**
   * onClick function of the "See Details" Button
   */
  onClick: PropTypes.func,
  /**
   * Status of the snap must be one
   */
  status: PropTypes.oneOf(Object.values(STATUSES)).isRequired,
  /**
   * Additional className added to the root div of the SnapSettingsCard component
   */
  className: PropTypes.string,
  /**
   * Optional additional props passed to the Card component
   */
  cardProps: PropTypes.shape(Card.propTypes),
  /**
   * Optional additional props passed to the ToggleButton component
   */
  toggleButtonProps: PropTypes.shape(ToggleButton.propTypes),
  /**
   * Optional additional props passed to the Button component
   */
  buttonProps: PropTypes.shape(Button.propTypes),
  /**
   * Optional additional props passed to the Chip component
   */
  chipProps: PropTypes.shape(Chip.propTypes),
};

export default SnapSettingsCard;
