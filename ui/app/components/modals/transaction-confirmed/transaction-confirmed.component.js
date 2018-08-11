import React from 'react'
import PropTypes from 'prop-types'

const TransactionConfirmed = (props, context) => {
  const { t } = context

  return (
    <div className="modal-container__content">
      <img src="images/check-icon.svg" />
      <div className="modal-container__title">
        { `${t('confirmed')}!` }
      </div>
      <div className="modal-container__description">
        { t('initialTransactionConfirmed') }
      </div>
    </div>
  )
}

TransactionConfirmed.contextTypes = {
  t: PropTypes.func,
}

export default TransactionConfirmed
