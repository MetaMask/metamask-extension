import React from 'react'
import PropTypes from 'prop-types'

const ConfirmPageContainerWarning = (props) => {
  return (
    <div className="confirm-page-container-warning">
      <img
        className="confirm-page-container-warning__icon"
        src="/images/alert.svg"
      />
      <div className="confirm-page-container-warning__warning">
        {props.warning}
      </div>
    </div>
  )
}

ConfirmPageContainerWarning.propTypes = {
  warning: PropTypes.string,
}

export default ConfirmPageContainerWarning
