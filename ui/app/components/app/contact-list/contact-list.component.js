import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Button from '../../ui/button';
import RecipientGroup from './recipient-group/recipient-group.component';

export default class ContactList extends PureComponent {
  static propTypes = {
    searchForContacts: PropTypes.func,
    searchForRecents: PropTypes.func,
    searchForMyAccounts: PropTypes.func,
    selectRecipient: PropTypes.func,
    children: PropTypes.node,
    selectedAddress: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    isShowingAllRecent: false,
  };

  renderRecents() {
    const { t } = this.context;
    const { isShowingAllRecent } = this.state;
    const nonContacts = this.props.searchForRecents();

    const showLoadMore = !isShowingAllRecent && nonContacts.length > 2;

    return (
      <div className="send__select-recipient-wrapper__recent-group-wrapper">
        <RecipientGroup
          label={t('recents')}
          items={showLoadMore ? nonContacts.slice(0, 2) : nonContacts}
          onSelect={this.props.selectRecipient}
          selectedAddress={this.props.selectedAddress}
        />
        {showLoadMore && (
          <Button
            type="link"
            className="send__select-recipient-wrapper__recent-group-wrapper__load-more"
            onClick={() => this.setState({ isShowingAllRecent: true })}
          >
            {t('loadMore')}
          </Button>
        )}
      </div>
    );
  }

  renderAddressBook() {
    const contacts = this.props.searchForContacts();

    const contactGroups = contacts.reduce((acc, contact) => {
      const firstLetter = contact.name.slice(0, 1).toUpperCase();
      acc[firstLetter] = acc[firstLetter] || [];
      const bucket = acc[firstLetter];
      bucket.push(contact);
      return acc;
    }, {});

    return Object.entries(contactGroups)
      .sort(([letter1], [letter2]) => {
        if (letter1 > letter2) {
          return 1;
        } else if (letter1 === letter2) {
          return 0;
        }
        return -1;
      })
      .map(([letter, groupItems]) => (
        <RecipientGroup
          key={`${letter}-contract-group`}
          label={letter}
          items={groupItems}
          onSelect={this.props.selectRecipient}
          selectedAddress={this.props.selectedAddress}
        />
      ));
  }

  renderMyAccounts() {
    const myAccounts = this.props.searchForMyAccounts();

    return (
      <RecipientGroup
        items={myAccounts}
        onSelect={this.props.selectRecipient}
        selectedAddress={this.props.selectedAddress}
      />
    );
  }

  render() {
    const {
      children,
      searchForRecents,
      searchForContacts,
      searchForMyAccounts,
    } = this.props;

    return (
      <div className="send__select-recipient-wrapper__list">
        {children || null}
        {searchForRecents && this.renderRecents()}
        {searchForContacts && this.renderAddressBook()}
        {searchForMyAccounts && this.renderMyAccounts()}
      </div>
    );
  }
}
