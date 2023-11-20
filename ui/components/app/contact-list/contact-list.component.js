import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { sortBy } from 'lodash';
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
    const unsortedContactsByLetter = this.props
      .searchForContacts()
      .reduce((obj, contact) => {
        const firstLetter = contact.name[0].toUpperCase();
        return {
          ...obj,
          [firstLetter]: [...(obj[firstLetter] || []), contact],
        };
      }, {});

    const letters = Object.keys(unsortedContactsByLetter).sort();

    const sortedContactGroups = letters.map((letter) => {
      return [
        letter,
        sortBy(unsortedContactsByLetter[letter], (contact) => {
          return contact.name.toLowerCase();
        }),
      ];
    });

    return sortedContactGroups.map(([letter, groupItems]) => (
      <RecipientGroup
        key={`${letter}-contact-group`}
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
        {searchForRecents ? this.renderRecents() : null}
        {searchForContacts ? this.renderAddressBook() : null}
        {searchForMyAccounts ? this.renderMyAccounts() : null}
      </div>
    );
  }
}
