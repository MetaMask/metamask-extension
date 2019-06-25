import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Fuse from 'fuse.js'
import Identicon from '../../../../components/ui/identicon'
import {isValidAddress} from '../../../../helpers/utils/util'
import Dialog from "../../../../components/ui/dialog";

export default class AddRecipient extends Component {

  static propTypes = {
    className: PropTypes.string,
    query: PropTypes.string,
    ownedAccounts: PropTypes.array,
    addressBook: PropTypes.array,
    updateGas: PropTypes.func,
    updateSendTo: PropTypes.func,
    ensResolution: PropTypes.string,
    toError: PropTypes.string,
    toWarning: PropTypes.string,
    ensResolutionError: PropTypes.string,
    selectedToken: PropTypes.object,
    hasHexData: PropTypes.bool,
    tokens: PropTypes.array,
  }

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  state = {
    isShowingTransfer: false,
    isShowingAllRecent: false,
  }

  selectRecipient = (to, nickname = '') => {
    const { updateSendTo, updateGas } = this.props

    updateSendTo(to, nickname)
    updateGas({ to })
  }

  searchForContacts = () => {
    const { addressBook } = this.props
    let contacts = addressBook.filter(({ name }) => !!name)
    const { query } = this.props

    if (query) {
      if (!this.contactFuse) {
        this.contactFuse = new Fuse(contacts, {
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
      contacts = this.contactFuse.search(query)
    }

    return contacts
  }

  searchForRecents = () => {
    const { addressBook, query } = this.props

    let nonContacts = addressBook.filter(({ name }) => !name)
    if (query) {
      if (!this.recentFuse) {
        this.recentFuse = new Fuse(nonContacts, {
          shouldSort: true,
          threshold: 0.45,
          location: 0,
          distance: 100,
          maxPatternLength: 32,
          minMatchCharLength: 1,
          keys: [
            { name: 'address', weight: 0.5 },
          ],
        })
      }
      nonContacts = this.recentFuse.search(query)
    }

    return nonContacts
  }

  render () {
    const { ensResolution, query } = this.props
    const { isShowingTransfer } = this.state

    let content

    if (isValidAddress(query)) {
      content = this.renderExplicitAddress(query)
    } else if (ensResolution) {
      content = this.renderExplicitAddress(ensResolution, query)
    } else if (isShowingTransfer) {
      content = this.renderTransfer()
    }

    return (
      <div className="send__select-recipient-wrapper">
        { this.renderDialogs() }
        { content || this.renderMain() }
      </div>
    )
  }

  renderExplicitAddress (address, name) {
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
          {
            name && (
              <div className="send__select-recipient-wrapper__group-item__subtitle">
                {ellipsify(address)}
              </div>
            )
          }
        </div>
      </div>
    )
  }

  renderTransfer () {
    const { ownedAccounts } = this.props
    const { t } = this.context

    return (
      <div className="send__select-recipient-wrapper__list">
        <div
          className="send__select-recipient-wrapper__list__link"
          onClick={() => this.setState({ isShowingTransfer: false })}
        >
          <div className="send__select-recipient-wrapper__list__back-caret"/>
          { t('backToAll') }
        </div>
        <RecipientGroup
          label={t('myAccounts')}
          items={ownedAccounts}
          onSelect={this.selectRecipient}
        />
      </div>
    )
  }

  renderMain () {
    const { t } = this.context
    const { query } = this.props

    return (
      <div className="send__select-recipient-wrapper__list">
        {
          !query && (
            <div
              className="send__select-recipient-wrapper__list__link"
              onClick={() => this.setState({ isShowingTransfer: true })}
            >
              { t('transferBetweenAccounts') }
            </div>
          )
        }
        { this.renderRecents() }
        { this.renderAddressBook() }
      </div>
    )
  }

  renderRecents () {
    const { isShowingAllRecent } = this.state
    const nonContacts = this.searchForRecents()
    const { t } = this.context

    const showLoadMore = !isShowingAllRecent && nonContacts.length > 2

    return (
      <div className="send__select-recipient-wrapper__recent-group-wrapper">
        <RecipientGroup
          label={t('recents')}
          items={showLoadMore ? nonContacts.slice(0, 2) : nonContacts}
          onSelect={this.selectRecipient}
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
    const contacts = this.searchForContacts()

    const contactGroups = contacts.reduce((acc, contact) => {
      const firstLetter = contact.name.slice(0, 1).toUpperCase()
      acc[firstLetter] = acc[firstLetter] || []
      const bucket = acc[firstLetter]
      bucket.push(contact)
      return acc
    }, {})

    return Object
      .entries(contactGroups)
      .map(([letter, groupItems]) => (
        <RecipientGroup
          key={`${letter}-contract-group`}
          label={letter}
          items={groupItems}
          onSelect={this.selectRecipient}
        />
      ))
  }

  renderDialogs () {
    const { toError, toWarning, ensResolutionError, ensResolution } = this.props
    const { t } = this.context
    const contacts = this.searchForContacts()
    const recents = this.searchForRecents()

    if (contacts.length || recents.length) {
      return null
    }

    if (ensResolutionError) {
      return (
        <Dialog
          type="error"
          className="send__error-dialog"
        >
          {ensResolutionError}
        </Dialog>
      )
    }

    if (toError && toError !== 'required' && !ensResolution) {
      return (
        <Dialog
          type="error"
          className="send__error-dialog"
        >
          {t(toError)}
        </Dialog>
      )
    }


    if (toWarning) {
      return (
        <Dialog
          type="warning"
          className="send__error-dialog"
        >
          {t(toWarning)}
        </Dialog>
      )
    }
  }

}

function ellipsify (text, first = 6, last = 4) {
  return `${text.slice(0, first)}...${text.slice(-last)}`
}

function RecipientGroup ({ label, items, onSelect }) {
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
          <div
            key={address}
            className="send__select-recipient-wrapper__group-item"
            onClick={() => onSelect(address, name)}
          >
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

RecipientGroup.propTypes = {
  label: PropTypes.string,
  items: PropTypes.arrayOf({
    address: PropTypes.string,
    name: PropTypes.string,
  }),
  onSelect: PropTypes.func.isRequired,
}
