import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../button'

class ConfirmResetAccount extends Component {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    resetAccount: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleReset () {
    this.props.resetAccount()
      .then(() => this.props.hideModal())
  }

  render () {
    const { t } = this.context

    return (
      <div className="modal-container">
        <div className="modal-container__content">
          <div className="modal-container__title">
            { `${t('resetAccount')}?` }
          </div>
          <div className="modal-container__description">
            { t('resetAccountDescription') }
          </div>
        </div>
        <div className="modal-container__footer">
          <Button
            type="default"
            className="modal-container__footer-button"
            onClick={() => this.props.hideModal()}
          >
            { t('nevermind') }
          </Button>
          <Button
            type="secondary"
            className="modal-container__footer-button"
            onClick={() => this.handleReset()}
          >
            { t('reset') }
          </Button>
        </div>
      </div>
    )
  }
}

export default ConfirmResetAccount
