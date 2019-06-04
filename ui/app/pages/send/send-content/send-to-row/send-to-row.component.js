import React, { Component } from 'react'
import PropTypes from 'prop-types'
import EnsInput from '../../../../components/app/ens-input'
import { getToErrorObject, getToWarningObject } from './send-to-row.utils.js'
import Identicon from '../../../../components/ui/identicon'

export default class SendToRow extends Component {

  static propTypes = {
    closeToDropdown: PropTypes.func,
    hasHexData: PropTypes.bool.isRequired,
    inError: PropTypes.bool,
    inWarning: PropTypes.bool,
    className: PropTypes.string,
    network: PropTypes.string,
    openToDropdown: PropTypes.func,
    selectedToken: PropTypes.object,
    to: PropTypes.string,
    toAccounts: PropTypes.array,
    ownedAccounts: PropTypes.array,
    addressBook: PropTypes.array,
    toDropdownOpen: PropTypes.bool,
    tokens: PropTypes.array,
    updateGas: PropTypes.func,
    updateSendTo: PropTypes.func,
    updateSendToError: PropTypes.func,
    updateSendToWarning: PropTypes.func,
    scanQrCode: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  handleToChange (to, nickname = '', toError, toWarning, network) {
    const { hasHexData, updateSendTo, updateSendToError, updateGas, tokens, selectedToken, updateSendToWarning } = this.props
    const toErrorObject = getToErrorObject(to, toError, hasHexData, tokens, selectedToken, network)
    const toWarningObject = getToWarningObject(to, toWarning, tokens, selectedToken)
    updateSendTo(to, nickname)
    updateSendToError(toErrorObject)
    updateSendToWarning(toWarningObject)
    if (toErrorObject.to === null) {
      updateGas({ to })
    }
  }

  render () {
    const {
      closeToDropdown,
      inError,
      inWarning,
      network,
      openToDropdown,
      to,
      toAccounts,
      toDropdownOpen,
    } = this.props

    return (
      <div className="send__select-recipient-wrapper">
        <EnsInput
          className="send__to-row"
          scanQrCode={_ => {
            this.context.metricsEvent({
              eventOpts: {
                category: 'Transactions',
                action: 'Edit Screen',
                name: 'Used QR scanner',
              },
            })
            this.props.scanQrCode()
          }}
          accounts={toAccounts}
          closeDropdown={() => closeToDropdown()}
          dropdownOpen={toDropdownOpen}
          inError={inError}
          name={'address'}
          network={network}
          onChange={({ toAddress, nickname, toError, toWarning }) => this.handleToChange(toAddress, nickname, toError, toWarning, this.props.network)}
          openDropdown={() => openToDropdown()}
          placeholder={this.context.t('recipientAddress')}
          to={to}
        />
        <div className="send__select-recipient-wrapper__list">
          { this.renderRecents() }
          { this.renderAddressBook() }
        </div>
      </div>
    )
  }

  renderRecents() {
    const { addressBook } = this.props
    const { t } = this.context
    const nonContacts = addressBook.filter(({ name }) => !name)

    console.log(nonContacts)

    return nonContacts.length > 0 && (
      <div className="send__select-recipient-wrapper__group">
        <div className="send__select-recipient-wrapper__group-label">
          {t('Recents')}
        </div>
        {
          nonContacts.map(({ address }) => (
            <div key={address} className="send__select-recipient-wrapper__group-item">
              <Identicon address={address} diameter={28} />
              <div className="send__select-recipient-wrapper__group-item__content">
                <div className="send__select-recipient-wrapper__group-item__title">
                  {ellipsify(address)}
                </div>
              </div>
            </div>
          ))
        }
      </div>
    )
  }

  renderAddressBook() {

  }

}

function ellipsify(text) {
  return `${text.slice(0, 6)}...${text.slice(-4)}`
}
