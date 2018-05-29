import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../button'

class TransactionConfirmed extends Component {
  render () {
    const { t } = this.context

    return (
      <div className="page-container page-container--full-width page-container--full-height">
        <div className="page-container__content transaction-confirmed">
          <img src="images/check-icon.svg" />
          <div className="transaction-confirmed__title">
            { `${t('confirmed')}!` }
          </div>
          <div className="transaction-confirmed__description">
            { t('initialTransactionConfirmed') }
          </div>
        </div>
        <div className="page-container__footer">
          <Button
            type="primary"
            className="page-container__footer-button"
            onClick={() => {
              this.props.hideModal()
              this.props.onHide()
            }}
          >
            { t('ok') }
          </Button>
        </div>
      </div>
    )
  }
}

TransactionConfirmed.propTypes = {
  hideModal: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
}

TransactionConfirmed.contextTypes = {
  t: PropTypes.func,
}

export default TransactionConfirmed
