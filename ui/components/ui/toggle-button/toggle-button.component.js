import React from 'react';
import PropTypes from 'prop-types';
import ReactToggleButton from 'react-toggle-button';
import classnames from 'classnames';

const trackStyle = {
  width: '40px',
  height: '24px',
  padding: '0px',
  borderRadius: '26px',
  border: '2px solid rgb(3, 125, 214)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const offTrackStyle = {
  ...trackStyle,
  border: '2px solid #8E8E8E',
};

const thumbStyle = {
  width: '18px',
  height: '18px',
  display: 'flex',
  boxShadow: 'none',
  alignSelf: 'center',
  borderRadius: '50%',
  position: 'relative',
};

const colors = {
  activeThumb: {
    base: '#037DD6',
  },
  inactiveThumb: {
    base: '#037DD6',
  },
  active: {
    base: '#ffffff',
    hover: '#ffffff',
  },
  inactive: {
    base: '#DADADA',
    hover: '#DADADA',
  },
};

const ToggleButton = (props) => {
<<<<<<< HEAD
  const { value, onToggle, offLabel, onLabel, disabled } = props;
=======
  const {
    value,
    onToggle,
    offLabel,
    onLabel,
    disabled,
    className,
    dataTestId,
  } = props;
>>>>>>> upstream/multichain-swaps-controller

  const modifier = value ? 'on' : 'off';

  return (
    <div
      className={classnames('toggle-button', `toggle-button--${modifier}`, {
        'toggle-button--disabled': disabled,
      })}
    >
      <ReactToggleButton
        value={value}
        onToggle={disabled ? undefined : onToggle}
        activeLabel=""
        inactiveLabel=""
        trackStyle={value ? trackStyle : offTrackStyle}
        thumbStyle={thumbStyle}
        thumbAnimateRange={[3, 18]}
        colors={colors}
        passThroughInputProps={{
          'data-testId': dataTestId,
        }}
      />
      <div className="toggle-button__status">
        <span className="toggle-button__label-off">{offLabel}</span>
        <span className="toggle-button__label-on">{onLabel}</span>
      </div>
    </div>
  );
};

ToggleButton.propTypes = {
  value: PropTypes.bool,
  onToggle: PropTypes.func,
  offLabel: PropTypes.string,
  onLabel: PropTypes.string,
  disabled: PropTypes.bool,
<<<<<<< HEAD
=======
  /**
   * Additional className to add to the ToggleButton
   */
  className: PropTypes.string,
  /**
   * A test id for the toggle button
   */
  dataTestId: PropTypes.string,
>>>>>>> upstream/multichain-swaps-controller
};

export default ToggleButton;
