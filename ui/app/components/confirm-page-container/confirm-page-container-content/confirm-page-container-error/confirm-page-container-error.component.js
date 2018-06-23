import React from 'react'
import PropTypes from 'prop-types'

const ConfirmPageContainerError = props => {
  return (
    <div className="confirm-page-container-error">
      <img
        src="/images/alert-red.svg"
        className="confirm-page-container-error__icon"
      />
      { `ALERT: ${props.error}` }
    </div>
  )
}

ConfirmPageContainerError.propTypes = {
  error: PropTypes.string,
}

export default ConfirmPageContainerError
