import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import RecipientGroup from './recipient-group/recipient-group.component'
import Fuse from 'fuse.js'

export default class ContactList extends PureComponent {
  static propTypes = {
    query: PropTypes.string,
    ownedAccounts: PropTypes.array,
    addressBook: PropTypes.array,
    searchForContacts: PropTypes.func,
    searchForRecents: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    isShowingAllRecent: false,
  }

  renderRecents () {
    const { isShowingAllRecent } = this.state
    const nonContacts = this.props.searchForRecents()
    const { t } = this.context

    const showLoadMore = !isShowingAllRecent && nonContacts.length > 2

    return (
      <div className="send__select-recipient-wrapper__recent-group-wrapper">
        <RecipientGroup
          label={t('recents')}
          items={showLoadMore ? nonContacts.slice(0, 2) : nonContacts}
          onSelect={this.props.selectRecipient}
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
    const contacts = this.props.searchForContacts()

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
          onSelect={this.props.selectRecipient}
        />
      ))
  }

  render () {
    const { t } = this.context
    const { query, ownedAccounts = [], children } = this.props

    return (
      <div className="send__select-recipient-wrapper__list">
        { children || null }
        { this.renderRecents() }
        { this.renderAddressBook() }
      </div>
    )
  }
}
