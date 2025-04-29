import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
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
      className={classnames(
        'icon-button',
        'w-16',
        {
          'icon-button--disabled': disabled,
          'opacity-30 cursor-auto': disabled,
        },
        className,
      )}
      data-testid={otherProps['data-testid'] ?? undefined}
      onClick={onClick}
      disabled={disabled}
    >
      {renderWrapper(
        <>
          <div
            data-theme="light"
            className={classnames(
              'icon-button__circle',
              'flex justify-center items-center h-9 w-9 bg-primary-default rounded-full mt-1.5 mb-1 mx-auto',
              iconButtonClassName,
            )}
          >
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
  iconButtonClassName: PropTypes.string,
  'data-testid': PropTypes.string,
};
