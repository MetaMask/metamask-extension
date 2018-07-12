import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../button'
import { addressSummary } from '../../../util'

class ConfirmRemoveAccount extends Component {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    removeAccount: PropTypes.func.isRequired,
    address: PropTypes.string.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleRemove () {
    this.props.removeAccount(this.props.address)
      .then(() => this.props.hideModal())
  }

  render () {
    const { t } = this.context

    return (
      <div className="modal-container">
        <div className="modal-container__content">
          <div className="modal-container__title">
            { `${t('removeAccount')}` }?
          </div>
          <div className="modal-container__address">
            {addressSummary(this.props.address)}
          </div>
          <div className="modal-container__description">
            { t('removeAccountDescription') }
            <a className="modal-container__link" rel="noopener noreferrer" target="_blank" href="https://consensys.zendesk.com/hc/en-us/articles/360004180111-What-are-imported-accounts-New-UI-">{ t('learnMore') }</a>
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
            onClick={() => this.handleRemove()}
          >
            { t('remove') }
          </Button>
        </div>
      </div>
    )
  }
}

export default ConfirmRemoveAccount
