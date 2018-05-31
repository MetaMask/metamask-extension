import React from 'react'
import PropTypes from 'prop-types'
import Button from '../../button'

const Notification = (props, context) => {
  return (
    <div className="modal-container">
      { props.children }
      <div className="modal-container__footer">
        <Button
          type="primary"
          onClick={() => props.onHide()}
        >
          { context.t('ok') }
        </Button>
      </div>
    </div>
  )
}

Notification.propTypes = {
  onHide: PropTypes.func.isRequired,
  children: PropTypes.element,
}

Notification.contextTypes = {
  t: PropTypes.func,
}

export default Notification
