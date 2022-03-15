import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import IconEye from '../icon/icon-eye';

const ShowHideToggle = ({
  id,
  checked,
  onChange,
  ariaLabel,
  className,
  dataTestId,
  disabled,
}) => {
  return (
    <div className={classnames('show-hide-toggle', className)}>
      <input
        className="show-hide-toggle__input"
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        data-testid={dataTestId}
        disabled={disabled}
      />
      <label htmlFor={id} className="show-hide-toggle__label">
        <IconEye ariaLabel={ariaLabel} className="show-hide-toggle__icon" />
      </label>
    </div>
  );
};

ShowHideToggle.propTypes = {
  /**
   * The id of the ShowHideToggle for htmlFor
   */
  id: PropTypes.string.isRequired,
  /**
   * If the ShowHideToggle is checked or not
   */
  checked: PropTypes.bool.isRequired,
  /**
   * The onChange handler of the ShowHideToggle
   */
  onChange: PropTypes.func.isRequired,
  /**
   * The aria-label of the IconEye svg component
   */
  ariaLabel: PropTypes.string,
  /**
   * An additional className to give the ShowHideToggle
   */
  className: PropTypes.string,
  /**
   * The data test id of the input
   */
  dataTestId: PropTypes.string,
  /**
   * Whether the input is disabled or not
   */
  disabled: PropTypes.bool,
};

export default ShowHideToggle;
