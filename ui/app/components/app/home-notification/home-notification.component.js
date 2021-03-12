import React, { useState } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Button from '../../ui/button';
import Checkbox from '../../ui/check-box';
import Tooltip from '../../ui/tooltip';

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
            <i className="fa fa-info-circle" />
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
  acceptText: PropTypes.node,
  checkboxText: PropTypes.node,
  checkboxTooltipText: PropTypes.node,
  classNames: PropTypes.array,
  descriptionText: PropTypes.node.isRequired,
  ignoreText: PropTypes.node,
  infoText: PropTypes.node,
  onAccept: PropTypes.func,
  onIgnore: PropTypes.func,
};

export default HomeNotification;
