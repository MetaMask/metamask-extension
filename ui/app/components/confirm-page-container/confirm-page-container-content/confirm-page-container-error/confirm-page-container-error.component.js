import React from 'react'
import PropTypes from 'prop-types'

const ConfirmPageContainerError = (props, context) => {
  const { errorMessage, errorKey } = props
  const error = errorKey ? context.t(errorKey) : errorMessage

  return (
    <div className="confirm-page-container-error">
      <img
        src="/images/alert-red.svg"
        className="confirm-page-container-error__icon"
      />
      { `ALERT: ${error}` }
    </div>
  )
}

ConfirmPageContainerError.propTypes = {
  errorMessage: PropTypes.string,
  errorKey: PropTypes.string,
}

ConfirmPageContainerError.contextTypes = {
  t: PropTypes.func,
}

export default ConfirmPageContainerError
