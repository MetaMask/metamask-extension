import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Fuse from 'fuse.js'
import Identicon from '../../../../components/ui/identicon'
import { isValidAddress } from '../../../../helpers/utils/util'
import Dialog from '../../../../components/ui/dialog'
import ContactList from '../../../../components/app/contact-list'
import RecipientGroup from '../../../../components/app/contact-list/recipient-group/recipient-group.component'
import { ellipsify } from '../../send.utils'
import { encodeNetId } from 'conflux-address-js'

export default class AddRecipient extends Component {
  static propTypes = {
    network: PropTypes.number,
    query: PropTypes.string,
    ownedAccounts: PropTypes.array,
    addressBook: PropTypes.array,
    updateGas: PropTypes.func,
    updateSendTo: PropTypes.func,
    ensResolution: PropTypes.string,
    toError: PropTypes.string,
    toWarning: PropTypes.string,
    ensResolutionError: PropTypes.string,
    addressBookEntryName: PropTypes.string,
    contacts: PropTypes.array,
    nonContacts: PropTypes.array,
  }

  constructor(props) {
    super(props)
    this.recentFuse = new Fuse(props.nonContacts, {
      shouldSort: true,
      threshold: 0.45,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [{ name: 'address', weight: 0.5 }],
    })

    this.contactFuse = new Fuse(props.contacts, {
      shouldSort: true,
      threshold: 0.45,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'address', weight: 0.5 },
      ],
    })
  }

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  state = {
    isShowingTransfer: false,
  }

  selectRecipient = (to, nickname = '', opt = {}) => {
    const { updateSendTo, updateGas } = this.props

    updateSendTo(to, nickname, opt)
    updateGas({ to })
  }

  searchForContacts = () => {
    const { query, contacts } = this.props

    let _contacts = contacts

    if (query) {
      this.contactFuse.setCollection(contacts)
      _contacts = this.contactFuse.search(query)
    }

    return _contacts
  }

  searchForRecents = () => {
    const { query, nonContacts } = this.props

    let _nonContacts = nonContacts

    if (query) {
      this.recentFuse.setCollection(nonContacts)
      _nonContacts = this.recentFuse.search(query)
    }

    return _nonContacts
  }

  render() {
    const { ensResolution, query, addressBookEntryName } = this.props
    const { isShowingTransfer } = this.state

    let content

    if (isValidAddress(query, 'account') || isValidAddress(query, 'contract')) {
      content = this.renderExplicitAddress(query)
    } else if (ensResolution) {
      content = this.renderExplicitAddress(
        ensResolution,
        addressBookEntryName || query
      )
    } else if (isShowingTransfer) {
      content = this.renderTransfer()
    }

    return (
      <div className="send__select-recipient-wrapper">
        {this.renderBase32AddressNotice()}
        {this.renderDialogs()}
        {content || this.renderMain()}
      </div>
    )
  }

  renderBase32AddressNotice() {
    return (
      <Dialog type="message" className="send__error-dialog">
        {this.context.t('base32AddressNoticeMedium')}
      </Dialog>
    )
  }

  renderExplicitAddress(address, name) {
    return (
      <div
        key={address}
        className="send__select-recipient-wrapper__group-item"
        onClick={() => this.selectRecipient(address, name)}
      >
        <Identicon address={address} diameter={28} />
        <div className="send__select-recipient-wrapper__group-item__content">
          <div className="send__select-recipient-wrapper__group-item__title">
            {name || ellipsify(address)}
          </div>
          {name && (
            <div className="send__select-recipient-wrapper__group-item__subtitle">
              {ellipsify(address)}
            </div>
          )}
        </div>
      </div>
    )
  }

  renderTransfer() {
    const { ownedAccounts } = this.props
    const { t } = this.context

    return (
      <div className="send__select-recipient-wrapper__list">
        <div
          className="send__select-recipient-wrapper__list__link"
          onClick={() => this.setState({ isShowingTransfer: false })}
        >
          <div className="send__select-recipient-wrapper__list__back-caret" />
          {t('backToAll')}
        </div>
        <RecipientGroup
          label={t('myAccounts')}
          items={ownedAccounts}
          onSelect={(addr, nickname) =>
            this.selectRecipient(addr, nickname, { fromMyAccounts: true })
          }
        />
      </div>
    )
  }

  renderMain() {
    const { t } = this.context
    const { query, ownedAccounts = [], addressBook } = this.props

    return (
      <div className="send__select-recipient-wrapper__list">
        <ContactList
          addressBook={addressBook}
          searchForContacts={this.searchForContacts.bind(this)}
          searchForRecents={this.searchForRecents.bind(this)}
          selectRecipient={this.selectRecipient.bind(this)}
        >
          {ownedAccounts && ownedAccounts.length > 1 && !query && (
            <div
              className="send__select-recipient-wrapper__list__link"
              onClick={() => this.setState({ isShowingTransfer: true })}
            >
              {t('transferBetweenAccounts')}
            </div>
          )}
        </ContactList>
      </div>
    )
  }

  renderDialogs() {
    const {
      network,
      toError,
      toWarning,
      ensResolutionError,
      ensResolution,
    } = this.props
    const { t } = this.context
    // const contacts = this.searchForContacts()
    const recents = this.searchForRecents()

    // if (contacts.length) {
    //   return null
    // }

    if (ensResolutionError) {
      return (
        <Dialog type="error" className="send__error-dialog">
          {ensResolutionError}
        </Dialog>
      )
    }

    if (toError && toError !== 'required' && !ensResolution) {
      return (
        <Dialog type="error" className="send__error-dialog">
          {t(toError, [encodeNetId(network)])}
        </Dialog>
      )
    }

    if (toWarning) {
      return (
        <Dialog type="warning" className="send__error-dialog">
          {t(toWarning)}
        </Dialog>
      )
    }

    if (recents.length) {
      return null
    }
  }
}
