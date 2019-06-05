import React, { Component } from 'react'
import PropTypes from 'prop-types'
import EnsInput from './ens-input'
import { getToErrorObject, getToWarningObject } from './add-recipient.js'
import Identicon from '../../../../components/ui/identicon'

export default class AddRecipient extends Component {

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

  state = {
    isShowingTransfer: false,
    isShowingAllRecent: false,
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
    const { t } = this.context
    const { isShowingTransfer } = this.state

    if (isShowingTransfer) {
      return this.renderTransfer()
    }

    return (
      <div className="send__select-recipient-wrapper">
        { this.renderInput() }
        <div className="send__select-recipient-wrapper__list">
          <div
            className="send__select-recipient-wrapper__list__link"
            onClick={() => this.setState({ isShowingTransfer: true })}
          >
            { t('transferBetweenAccounts') }
          </div>
          { this.renderRecents() }
          { this.renderAddressBook() }
        </div>
      </div>
    )
  }

  renderInput () {
    const { t } = this.context
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
        placeholder={t('recipientAddress')}
        to={to}
      />
    )
  }

  renderTransfer () {
    const { ownedAccounts } = this.props
    const { t } = this.context

    return (
      <div className="send__select-recipient-wrapper">
        { this.renderInput() }
        <div className="send__select-recipient-wrapper__list">
          <div
            className="send__select-recipient-wrapper__list__link"
            onClick={() => this.setState({ isShowingTransfer: false })}
          >
            <div className="send__select-recipient-wrapper__list__back-caret"/>
            { t('backToAll') }
          </div>
          <RecipientGroup label={t('myAccounts')} items={ownedAccounts} />
        </div>
      </div>
    )
  }

  renderRecents () {
    const { addressBook } = this.props
    const { isShowingAllRecent } = this.state
    const { t } = this.context
    const nonContacts = addressBook.filter(({ name }) => !name)
    const showLoadMore = !isShowingAllRecent && nonContacts.length > 2

    return (
      <div className="send__select-recipient-wrapper__recent-group-wrapper">
        <RecipientGroup
          label={t('recents')}
          items={showLoadMore ? nonContacts.slice(0, 2) : nonContacts}
        />
        {
          showLoadMore && (
            <div
              className="send__select-recipient-wrapper__recent-group-wrapper__load-more"
              onClick={() => this.setState({ isShowingAllRecents: true })}
            >
              {t('loadMore')}
            </div>
          )
        }
      </div>
    )
  }

  renderAddressBook () {
    const { addressBook } = this.props
    const contacts = addressBook.filter(({ name }) => !!name)
    // const contacts = [
    //   { address: '0x7d2b3ff3Ca36F073de7fc56baC4a4E908DaD6720', name: 'Albert' },
    //   { address: '0x7d2b3ff3Ca36F073de7fc56baC4a4E908DaD6721', name: 'Alan' },
    //   { address: '0x7d2b3ff3Ca36F073de7fc56baC4a4E908DaD6722', name: 'Alex' },
    //   { address: '0x7d2b3ff3Ca36F073de7fc56baC4a4E908DaD6723', name: 'Brian' },
    //   { address: '0x7d2b3ff3Ca36F073de7fc56baC4a4E908DaD6724', name: 'Catherine' },
    //   { address: '0x7d2b3ff3Ca36F073de7fc56baC4a4E908DaD6725', name: 'Benjamin' },
    //   { address: '0x7d2b3ff3Ca36F073de7fc56baC4a4E908DaD6726', name: 'David' },
    //   { address: '0x7d2b3ff3Ca36F073de7fc56baC4a4E908DaD6727', name: 'Jacky' },
    //   { address: '0x7d2b3ff3Ca36F073de7fc56baC4a4E908DaD6728', name: 'Daniel' },
    //   { address: '0x7d2b3ff3Ca36F073de7fc56baC4a4E908DaD6729', name: 'Whymarrh' },
    // ]

    const contactGroups = contacts.reduce((acc, contact) => {
      const firstLetter = contact.name.slice(0, 1).toUpperCase()
      acc[firstLetter] = acc[firstLetter] || []
      const bucket = acc[firstLetter]
      bucket.push(contact)
      return acc
    }, {})

    return Object
      .entries(contactGroups)
      .map(([letter, items]) => (
        <RecipientGroup
          key={`${letter}-contract-group`}
          label={letter}
          items={items}
        />
      ))
  }

}

function ellipsify(text, first = 6, last = 4) {
  return `${text.slice(0, first)}...${text.slice(-last)}`
}

function RecipientGroup ({ label, items }) {
  if (!items || !items.length) {
    return null
  }

  return (
    <div className="send__select-recipient-wrapper__group">
      <div className="send__select-recipient-wrapper__group-label">
        {label}
      </div>
      {
        items.map(({ address, name }) => (
          <div key={address} className="send__select-recipient-wrapper__group-item">
            <Identicon address={address} diameter={28} />
            <div className="send__select-recipient-wrapper__group-item__content">
              <div className="send__select-recipient-wrapper__group-item__title">
                {name || ellipsify(address)}
              </div>
              {
                name && (
                  <div className="send__select-recipient-wrapper__group-item__subtitle">
                    {ellipsify(address)}
                  </div>
                )
              }
            </div>
          </div>
        ))
      }
    </div>
  )
}
