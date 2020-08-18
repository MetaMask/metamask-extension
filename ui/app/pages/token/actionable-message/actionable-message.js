import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default function ActionableMessage ({
  shown = true,
  message = '',
  actions = [],
  className = '',
}) {
  return (
    shown
      ? (
        <div className={classnames('actionable-message', className)}>
          <div className="actionable-message__message">
            {message}
          </div>
          <div className="actionable-message__actions">
            {
              actions.map(({ label, onClick, actionClassName }, index) => (
                <div
                  className={classnames('actionable-message__action', actionClassName)}
                  onClick={onClick}
                  key={`actionable-message-action-${index}`}
                >
                  {label}
                </div>
              ))
            }
          </div>
        </div>
      )
      : null
  )
}

ActionableMessage.propTypes = {
  shown: PropTypes.bool,
  message: PropTypes.string.isRequired,
  actions: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
    actionClassName: PropTypes.string,
  }),
  className: PropTypes.string,
}
