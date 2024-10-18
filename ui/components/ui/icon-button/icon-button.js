import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Text } from '../../component-library';
import { TextVariant } from '../../../helpers/constants/design-system';
import Tooltip from '../tooltip/tooltip';

const defaultRender = (inner) => inner;
export default function IconButton(props) {
  // Do not use destructuring in the parameter itself, otherwise ts will complain
  // that optional props (like tooltipRender, disabled) must be passed!
  const {
    onClick,
    Icon,
    disabled,
    label,
    tooltipRender,
    className,
    ...otherProps
  } = props;
  const renderWrapper = tooltipRender ?? defaultRender;

  return (
    <button
      className={classNames('icon-button', className, {
        'icon-button--disabled': disabled,
      })}
      data-testid={otherProps['data-testid'] ?? undefined}
      onClick={onClick}
      disabled={disabled}
    >
      {renderWrapper(
        <>
          <div data-theme="light" className="icon-button__circle">
            {Icon}
          </div>
          {label.length > 10 ? (
            <Tooltip title={label} position="bottom">
              <Text
                className="icon-button__label-large"
                ellipsis
                variant={TextVariant.bodySm}
              >
                {label}
              </Text>
            </Tooltip>
          ) : (
            <Text
              className="icon-button__label"
              ellipsis
              variant={TextVariant.bodySm}
            >
              {label}
            </Text>
          )}
        </>,
      )}
    </button>
  );
}

IconButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  Icon: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  tooltipRender: PropTypes.func,
  className: PropTypes.string,
  'data-testid': PropTypes.string,
};
