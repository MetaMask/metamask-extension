import React, { useState } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Button from '../../ui/button';
import Checkbox from '../../ui/check-box';
import Tooltip from '../../ui/tooltip';
import { Icon, IconName } from '../../component-library';
import { IconColor } from '../../../helpers/constants/design-system';

const HomeNotification = ({
  acceptText,
  checkboxText,
  checkboxTooltipText,
  classNames = [],
  descriptionText,
  ignoreText,
  infoText,
  onAccept,
  onIgnore,
}) => {
  const [checkboxState, setCheckBoxState] = useState(false);

  const checkboxElement = checkboxText && (
    <Checkbox
      id="homeNotification_checkbox"
      checked={checkboxState}
      className="home-notification__checkbox"
      onClick={() => setCheckBoxState((checked) => !checked)}
    />
  );

  return (
    <div className={classnames('home-notification', ...classNames)}>
      <div className="home-notification__content">
        <div className="home-notification__content-container">
          <div className="home-notification__text">{descriptionText}</div>
        </div>
        {infoText ? (
          <Tooltip
            position="top"
            title={infoText}
            wrapperClassName="home-notification__tooltip-wrapper"
          >
            <Icon name={IconName.Info} color={IconColor.iconDefault} />
          </Tooltip>
        ) : null}
      </div>
      <div className="home-notification__buttons">
        {onAccept && acceptText ? (
          <Button
            type="primary"
            className="home-notification__accept-button"
            onClick={onAccept}
          >
            {acceptText}
          </Button>
        ) : null}
        {onIgnore && ignoreText ? (
          <Button
            type="secondary"
            className="home-notification__ignore-button"
            // Some onIgnore handlers use the checkboxState to determine whether
            // to disable the notification
            onClick={() => onIgnore(checkboxState)}
          >
            {ignoreText}
          </Button>
        ) : null}
        {checkboxText ? (
          <div className="home-notification__checkbox-wrapper">
            {checkboxTooltipText ? (
              <Tooltip
                position="top"
                title={checkboxTooltipText}
                wrapperClassName="home-notification__checkbox-label-tooltip"
              >
                {checkboxElement}
              </Tooltip>
            ) : (
              checkboxElement
            )}
            <label
              className="home-notification__checkbox-label"
              htmlFor="homeNotification_checkbox"
            >
              {checkboxText}
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
};

HomeNotification.propTypes = {
  /**
   * The text for the "Accept" button. This must be accompanied by the `onAccept` prop.
   *
   * The "Accept" button is only rendered if this prop is set.
   */
  acceptText: PropTypes.node,
  /**
   * The text to display alongside the checkbox.
   *
   * The checkbox state is passed to the `onIgnore` handler, so this should only be used if the `onIgnore` prop is set.
   *
   * The checkbox is only rendered if this prop is set.
   */
  checkboxText: PropTypes.node,
  /**
   * The text to display in the checkbox tooltip.
   *
   * The tooltip is only rendered if this prop is set.
   */
  checkboxTooltipText: PropTypes.node,
  /**
   * Custom class names.
   */
  classNames: PropTypes.array,
  /**
   * The notification description.
   */
  descriptionText: PropTypes.node.isRequired,
  /**
   * The text for the "Ignore" button. This must be accompanied by the `onIgnore` prop.
   *
   * The "Ignore" button is only rendered if this prop is set.
   */
  ignoreText: PropTypes.node,
  /**
   * The text for the info icon tooltip in the top-right of the notification.
   *
   * The info-icon is only rendered if this prop is set.
   */
  infoText: PropTypes.node,
  /**
   * The handler for the "Accept" button. This must be accompanied by the `acceptText` prop.
   */
  onAccept: PropTypes.func,
  /**
   * The handler for the "Ignore" button. This must be accompanied by the `ignoreText` prop.
   *
   * If `checkboxText` is set, the checkbox state will be passed to this function as a boolean.
   */
  onIgnore: PropTypes.func,
};

export default HomeNotification;
