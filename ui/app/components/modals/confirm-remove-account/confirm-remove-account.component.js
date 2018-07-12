import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../button'
import { addressSummary } from '../../../util'
import Identicon from '../../identicon'
import genAccountLink from '../../../../lib/account-link'

class ConfirmRemoveAccount extends Component {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    removeAccount: PropTypes.func.isRequired,
    identity: PropTypes.object.isRequired,
    network: PropTypes.string.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleRemove () {
    this.props.removeAccount(this.props.identity.address)
      .then(() => this.props.hideModal())
  }

  renderSelectedAccount () {
    const { identity } = this.props
    return (
      <div className="modal-container__account">
        <div className="modal-container__account__identicon">
          <Identicon
              address={identity.address}
              diameter={32}
          />
        </div>
        <div className="modal-container__account__name">
            <span className="modal-container__account__label">Name</span>
            <span className="account_value">{identity.name}</span>
        </div>
        <div className="modal-container__account__address">
            <span className="modal-container__account__label">Public Address</span>
            <span className="account_value">{ addressSummary(identity.address, 4, 4) }</span>
        </div>
        <div className="modal-container__account__link">
          <a
            className=""
            href={genAccountLink(identity.address, this.props.network)}
            target={'_blank'}
            title={this.context.t('etherscanView')}
          >
            <img src="images/popout.svg" />
          </a>
        </div>
      </div>
    )
  }

  render () {
    const { t } = this.context

    return (
      <div className="modal-container">
        <div className="modal-container__content">
          <div className="modal-container__title">
            { `${t('removeAccount')}` }?
          </div>
            { this.renderSelectedAccount() }
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
