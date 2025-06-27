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
    iconButtonClassName = '',
    ...otherProps
  } = props;
  const renderWrapper = tooltipRender ?? defaultRender;

  return (
    <button
      className={classNames('icon-button-round', className, {
        'icon-button-round--disabled': disabled,
      })}
      data-testid={otherProps['data-testid'] ?? undefined}
      onClick={onClick}
      disabled={disabled}
    >
      {renderWrapper(
        <>
          <div
            className={classNames(
              'icon-button-round__circle',
              iconButtonClassName,
            )}
          >
            {Icon}
          </div>
          {label.length > 10 ? (
            <Tooltip title={label} position="bottom">
              <Text
                className="icon-button-round__label-large"
                ellipsis
                variant={TextVariant.bodySmMedium}
              >
                {label}
              </Text>
            </Tooltip>
          ) : (
            <Text
              className="icon-button-round_label"
              ellipsis
              variant={TextVariant.bodySmMedium}
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
  iconButtonClassName: PropTypes.string,
  'data-testid': PropTypes.string,
};
