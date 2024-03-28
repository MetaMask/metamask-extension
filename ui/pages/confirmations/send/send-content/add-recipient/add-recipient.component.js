import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';

import Dialog from '../../../../../components/ui/dialog';
import ContactList from '../../../../../components/app/contact-list';
import RecipientGroup from '../../../../../components/app/contact-list/recipient-group/recipient-group.component';

import { Text } from '../../../../../components/component-library';
import Box from '../../../../../components/ui/box';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import DomainInputResolutionCell from './domain-input-resolution-cell';

export default class AddRecipient extends Component {
  static propTypes = {
    userInput: PropTypes.string,
    ownedAccounts: PropTypes.array,
    addressBook: PropTypes.array,
    updateRecipient: PropTypes.func,
    domainResolutions: PropTypes.arrayOf(PropTypes.object),
    domainError: PropTypes.string,
    domainWarning: PropTypes.string,
    contacts: PropTypes.array,
    nonContacts: PropTypes.array,
    addHistoryEntry: PropTypes.func,
    recipient: PropTypes.shape({
      address: PropTypes.string,
      nickname: PropTypes.string,
      error: PropTypes.string,
      warning: PropTypes.string,
    }),
    domainType: PropTypes.string,
    updateRecipientUserInput: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.recentFuse = new Fuse(props.nonContacts, {
      shouldSort: true,
      threshold: 0.45,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [{ name: 'address', weight: 0.5 }],
    });

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
    });
  }

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  selectRecipient = (address, nickname = '', type = 'user input') => {
    this.props.addHistoryEntry(
      `sendFlow - User clicked recipient from ${type}. address: ${address}, nickname ${nickname}`,
    );
    this.props.updateRecipient({ address, nickname });
    this.props.updateRecipientUserInput(address);
  };

  searchForContacts = () => {
    const { userInput, contacts } = this.props;

    let _contacts = contacts;

    if (userInput) {
      this.contactFuse.setCollection(contacts);
      _contacts = this.contactFuse.search(userInput);
    }

    return _contacts;
  };

  searchForRecents = () => {
    const { userInput, nonContacts } = this.props;

    let _nonContacts = nonContacts;

    if (userInput) {
      this.recentFuse.setCollection(nonContacts);
      _nonContacts = this.recentFuse.search(userInput);
    }

    return _nonContacts;
  };

  render() {
    const {
      domainResolutions,
      recipient,
      userInput,
      ownedAccounts = [],
      domainType,
    } = this.props;

    let content;

    if (recipient.address) {
      content = (
        <DomainInputResolutionCell
          domainType={domainType}
          address={recipient.address}
          domainName={recipient.nickname}
          onClick={() =>
            this.selectRecipient(
              recipient.address,
              recipient.nickname,
              'validated user input',
            )
          }
        />
      );
    } else if (domainResolutions?.length > 0 && !recipient.error) {
      content = domainResolutions.map((domainResolution) => {
        const {
          resolvedAddress,
          resolvingSnap,
          addressBookEntryName,
          protocol,
        } = domainResolution;
        return (
          <DomainInputResolutionCell
            key={`${resolvedAddress}${resolvingSnap}${protocol}`}
            domainType={domainType}
            address={resolvedAddress}
            domainName={addressBookEntryName || userInput}
            onClick={() =>
              this.selectRecipient(
                resolvedAddress,
                addressBookEntryName || userInput,
                'Domain resolution',
              )
            }
            protocol={protocol}
            resolvingSnap={resolvingSnap}
          />
        );
      });
    }

    return (
      <Box className="send__select-recipient-wrapper">
        {ownedAccounts &&
          ownedAccounts.length > 1 &&
          !userInput &&
          this.renderTransfer()}
        {this.renderDialogs()}
        {content || this.renderMain()}
      </Box>
    );
  }

  renderTransfer() {
    const { t } = this.context;
    let { ownedAccounts } = this.props;
    const { userInput } = this.props;

    if (userInput) {
      ownedAccounts = ownedAccounts.filter(
        (item) =>
          item.metadata.name.toLowerCase().indexOf(userInput.toLowerCase()) >
            -1 ||
          item.address.toLowerCase().indexOf(userInput.toLowerCase()) > -1,
      );
    }

    return (
      <>
        <Box marginLeft={4} marginRight={4} marginTop={2} marginBottom={2}>
          <Text
            variant={TextVariant.bodyLgMedium}
            color={TextColor.textAlternative}
          >
            {t('yourAccounts')}
          </Text>
        </Box>
        <div className="send__select-recipient-wrapper__list">
          <RecipientGroup
            items={ownedAccounts}
            onSelect={(address, name) =>
              this.selectRecipient(address, name, 'my accounts')
            }
          />
        </div>
      </>
    );
  }

  renderMain() {
    const { t } = this.context;
    const { addressBook, userInput } = this.props;
    return (
      <div className="send__select-recipient-wrapper__list">
        {addressBook.length > 0 && !userInput ? (
          <Box marginLeft={4} marginRight={4} marginTop={2} marginBottom={2}>
            <Text
              variant={TextVariant.bodyLgMedium}
              color={TextColor.textAlternative}
            >
              {t('contacts')}
            </Text>
          </Box>
        ) : null}
        <ContactList
          addressBook={addressBook}
          searchForContacts={this.searchForContacts.bind(this)}
          searchForRecents={this.searchForRecents.bind(this)}
          selectRecipient={(address, name) => {
            this.selectRecipient(
              address,
              name,
              `${name ? 'contact' : 'recent'} list`,
            );
          }}
        />
      </div>
    );
  }

  renderDialogs() {
    const { domainError, recipient, domainWarning } = this.props;
    const { t } = this.context;

    if (domainError || (recipient.error && recipient.error !== 'required')) {
      return (
        <Dialog type="error" className="send__error-dialog">
          {t(domainError ?? recipient.error)}
        </Dialog>
      );
    } else if (domainWarning || recipient.warning) {
      return (
        <Dialog type="warning" className="send__error-dialog">
          {t(domainWarning ?? recipient.warning)}
        </Dialog>
      );
    }

    return null;
  }
}
