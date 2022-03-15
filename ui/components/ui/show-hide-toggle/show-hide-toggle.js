import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import IconEye from '../icon/icon-eye';
import IconEyeSlash from '../icon/icon-eye-slash';

const ShowHideToggle = ({
  id,
  shown,
  onChange,
  ariaLabelHidden,
  ariaLabelShown,
  className,
  'data-testid': dataTestId,
  disabled,
  title,
}) => {
  return (
    <div className={classnames('show-hide-toggle', className)}>
      <input
        className="show-hide-toggle__input"
        id={id}
        type="checkbox"
        checked={shown}
        onChange={onChange}
        data-testid={dataTestId}
        disabled={disabled}
      />
      <label htmlFor={id} className="show-hide-toggle__label" title={title}>
        {shown ? (
          <IconEye
            ariaLabel={ariaLabelShown}
            className="show-hide-toggle__icon"
          />
        ) : (
          <IconEyeSlash
            ariaLabel={ariaLabelHidden}
            className="show-hide-toggle__icon"
          />
        )}
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
   * If the ShowHideToggle is in the "shown" state or not
   */
  shown: PropTypes.bool.isRequired,
  /**
   * The onChange handler of the ShowHideToggle
   */
  onChange: PropTypes.func.isRequired,
  /**
   * The aria-label of the icon representing the "hidden" state
   */
  ariaLabelHidden: PropTypes.string.isRequired,
  /**
   * The aria-label of the icon representing the "shown" state
   */
  ariaLabelShown: PropTypes.string.isRequired,
  /**
   * An additional className to give the ShowHideToggle
   */
  className: PropTypes.string,
  /**
   * The data test id of the input
   */
  'data-testid': PropTypes.string,
  /**
   * Whether the input is disabled or not
   */
  disabled: PropTypes.bool,
  /**
   * The title for the toggle. This is shown in a tooltip on hover.
   */
  title: PropTypes.string,
};

export default ShowHideToggle;
