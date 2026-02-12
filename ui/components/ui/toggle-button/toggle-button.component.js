import React from 'react';
import PropTypes from 'prop-types';
import ReactToggleButton from 'react-toggle-button';
import classnames from 'classnames';
import { lightTheme, darkTheme } from '@metamask/design-tokens';
import { useTheme } from '../../../hooks/useTheme';

const trackStyle = {
  width: '40px',
  height: '24px',
  padding: '0px',
  borderRadius: '26px',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const offTrackStyle = {
  ...trackStyle,
  border: 'none',
};

const thumbStyle = {
  width: '18px',
  height: '18px',
  display: 'flex',
  boxShadow: 'var(--shadow-size-xs) var(--color-shadow-default)',
  alignSelf: 'center',
  borderRadius: '50%',
  position: 'relative',
};

const colorsLight = {
  activeThumb: {
    base: lightTheme.colors.primary.inverse,
  },
  inactiveThumb: {
    base: lightTheme.colors.primary.inverse,
  },
  active: {
    base: lightTheme.colors.primary.default,
    hover: lightTheme.colors.primary.defaultHover,
  },
  inactive: {
    base: lightTheme.colors.icon.muted,
    hover: lightTheme.colors.icon.muted,
  },
};

const colorsDark = {
  activeThumb: {
    base: lightTheme.colors.primary.inverse,
  },
  inactiveThumb: {
    base: lightTheme.colors.primary.inverse,
  },
  active: {
    base: darkTheme.colors.primary.default,
    hover: darkTheme.colors.primary.defaultHover,
  },
  inactive: {
    base: darkTheme.colors.icon.muted,
    hover: darkTheme.colors.icon.muted,
  },
};

const ToggleButton = (props) => {
  const {
    value,
    onToggle,
    offLabel,
    onLabel,
    disabled,
    className,
    dataTestId,
  } = props;

  const modifier = value ? 'on' : 'off';

  const theme = useTheme();

  return (
    <label
      tabIndex="0"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onToggle(value);
        }
      }}
      className={classnames(
        'toggle-button',
        `toggle-button--${modifier}`,
        {
          'toggle-button--disabled': disabled,
        },
        className,
      )}
    >
      <ReactToggleButton
        value={value}
        onToggle={disabled ? undefined : onToggle}
        activeLabel=""
        inactiveLabel=""
        trackStyle={value ? trackStyle : offTrackStyle}
        thumbStyle={thumbStyle}
        thumbAnimateRange={[3, 18]}
        colors={theme === 'light' ? colorsLight : colorsDark}
        passThroughInputProps={{
          'data-testid': dataTestId,
        }}
      />
      <div className="toggle-button__status">
        <span className="toggle-button__label-off">{offLabel}</span>
        <span className="toggle-button__label-on">{onLabel}</span>
      </div>
    </label>
  );
};

ToggleButton.propTypes = {
  /**
   * ToggleButton value
   */
  value: PropTypes.bool,
  /**
   * The onChange handler of the ToggleButton
   */
  onToggle: PropTypes.func,
  /**
   * Label text when toggle is off
   */
  offLabel: PropTypes.string,
  /**
   * Label text when toggle is on
   */
  onLabel: PropTypes.string,
  /**
   * Disables ToggleButton if true. Set to false as default
   */
  disabled: PropTypes.bool,
  /**
   * Additional className to add to the ToggleButton
   */
  className: PropTypes.string,
  /**
   * A test id for the toggle button
   */
  dataTestId: PropTypes.string,
};

export default ToggleButton;
