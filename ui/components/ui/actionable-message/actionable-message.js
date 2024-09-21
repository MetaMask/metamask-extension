import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import InfoTooltip from '../info-tooltip';
import InfoTooltipIcon from '../info-tooltip/info-tooltip-icon';

const CLASSNAME_WARNING = 'actionable-message--warning';
const CLASSNAME_DANGER = 'actionable-message--danger';
const CLASSNAME_SUCCESS = 'actionable-message--success';
const CLASSNAME_WITH_RIGHT_BUTTON = 'actionable-message--with-right-button';

export const typeHash = {
  warning: CLASSNAME_WARNING,
  danger: CLASSNAME_DANGER,
  success: CLASSNAME_SUCCESS,
  default: '',
};

/**
 * @deprecated `<ActionableMessage />` has been deprecated in favor of the `<BannerAlert />`
 * component in ./ui/components/component-library/banner-alert/banner-alert.js.
 * See storybook documentation for BannerAlert here:
 * {@see {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-banneralert--default-story#banneralert}}
 *
 * Help to replace `ActionableMessage` with `BannerAlert` by submitting a PR against
 * {@link https://github.com/MetaMask/metamask-extension/issues/19528}
 */

export default function ActionableMessage({
  message = '',
  primaryAction = null,
  primaryActionV2 = null,
  secondaryAction = null,
  className = '',
  infoTooltipText = '',
  withRightButton = false,
  type = 'default',
  useIcon = false,
  icon,
  iconFillColor = '',
  roundedButtons,
  dataTestId,
  autoHideTime = 0,
  onAutoHide,
}) {
  const [shouldDisplay, setShouldDisplay] = useState(true);
  useEffect(
    function () {
      if (autoHideTime === 0) {
        return undefined;
      }

      const timeout = setTimeout(() => {
        onAutoHide?.();
        setShouldDisplay(false);
      }, autoHideTime);

      return function () {
        clearTimeout(timeout);
      };
    },
    [autoHideTime, onAutoHide],
  );

  const actionableMessageClassName = classnames(
    'actionable-message',
    typeHash[type],
    withRightButton ? CLASSNAME_WITH_RIGHT_BUTTON : null,
    className,
    { 'actionable-message--with-icon': useIcon },
  );

  const onlyOneAction =
    (primaryAction && !secondaryAction) || (secondaryAction && !primaryAction);

  if (!shouldDisplay) {
    return null;
  }

  return (
    <div className={actionableMessageClassName} data-testid={dataTestId}>
      {useIcon ? icon || <InfoTooltipIcon fillColor={iconFillColor} /> : null}
      {infoTooltipText && (
        <InfoTooltip
          position="left"
          contentText={infoTooltipText}
          wrapperClassName="actionable-message__info-tooltip-wrapper"
        />
      )}
      <div className="actionable-message__message">{message}</div>
      {primaryActionV2 && (
        <button
          className="actionable-message__action-v2"
          onClick={primaryActionV2.onClick}
        >
          {primaryActionV2.label}
        </button>
      )}
      {(primaryAction || secondaryAction) && (
        <div
          className={classnames('actionable-message__actions', {
            'actionable-message__actions--single': onlyOneAction,
          })}
        >
          {primaryAction && (
            <button
              className={classnames(
                'actionable-message__action',
                'actionable-message__action--primary',
                `actionable-message__action-${type}`,
                {
                  'actionable-message__action--rounded': roundedButtons,
                },
              )}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              className={classnames(
                'actionable-message__action',
                'actionable-message__action--secondary',
                `actionable-message__action-${type}`,
                {
                  'actionable-message__action--rounded': roundedButtons,
                },
              )}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

ActionableMessage.propTypes = {
  /**
   * Text inside actionable message
   */
  message: PropTypes.node.isRequired,
  /**
   * First button props that have label and onClick props
   */
  primaryAction: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
  }),
  /**
   * Another style of primary action.
   * This probably shouldn't have been added. A `children` prop might have been more appropriate.
   */
  primaryActionV2: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
  }),
  /**
   * Second button props that have label and onClick props
   */
  secondaryAction: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
  }),
  /**
   * Additional css className for the component based on the parent css
   */
  className: PropTypes.string,
  /**
   * change color theme for the component that already predefined in css
   */
  type: PropTypes.oneOf(Object.keys(typeHash)),
  /**
   * change text align to left and button to bottom right
   */
  withRightButton: PropTypes.bool,
  /**
   * Add tooltip and custom message
   */
  infoTooltipText: PropTypes.string,
  /**
   * Add tooltip icon in the left component without message
   */
  useIcon: PropTypes.bool,
  /**
   * Custom icon component
   */
  icon: PropTypes.node,
  /**
   * change tooltip icon color
   */
  iconFillColor: PropTypes.string,
  /**
   * Whether the buttons are rounded
   */
  roundedButtons: PropTypes.bool,
  dataTestId: PropTypes.string,
  /**
   * Whether the actionable message should auto-hide itself after a given amount of time
   */
  autoHideTime: PropTypes.number,
  /**
   * Callback when autoHide time expires
   */
  onAutoHide: PropTypes.func,
};
