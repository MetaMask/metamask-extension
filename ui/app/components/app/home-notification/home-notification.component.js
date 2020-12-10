import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import Button from '../../ui/button'
import Tooltip from '../../ui/tooltip'

const HomeNotification = ({
  acceptText,
  classNames = [],
  descriptionText,
  ignoreText,
  infoText,
  onAccept,
  onIgnore,
}) => {
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
            onClick={onIgnore}
          >
            {ignoreText}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

HomeNotification.propTypes = {
  acceptText: PropTypes.node,
  classNames: PropTypes.array,
  descriptionText: PropTypes.node.isRequired,
  ignoreText: PropTypes.node,
  infoText: PropTypes.node,
  onAccept: PropTypes.func,
  onIgnore: PropTypes.func,
}

export default HomeNotification
