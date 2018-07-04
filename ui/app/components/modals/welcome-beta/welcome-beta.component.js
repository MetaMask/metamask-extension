import React from 'react'
import PropTypes from 'prop-types'

const TransactionConfirmed = (_, context) => {
  const { t } = context

  return (
    <div className="modal-container__content">
      <div className="modal-container__title">
        { `${t('uiWelcome')}` }
      </div>
      <div className="modal-container__description">
        { t('uiWelcomeMessage') }
      </div>
    </div>
  )
}

TransactionConfirmed.contextTypes = {
  t: PropTypes.func,
}

export default TransactionConfirmed
