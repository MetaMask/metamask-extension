import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import Identicon from '../../../../../components/ui/identicon';
import Dialog from '../../../../../components/ui/dialog';
import ContactList from '../../../../../components/app/contact-list';
import RecipientGroup from '../../../../../components/app/contact-list/recipient-group/recipient-group.component';
import { ellipsify } from '../../send.utils';
import Confusable from '../../../../../components/ui/confusable';
import {
  Text,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  AvatarIcon,
  AvatarIconSize,
  IconName,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../../components/component-library';
import Box from '../../../../../components/ui/box';
import {
  TextColor,
  TextVariant,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  IconColor,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../../helpers/constants/design-system';

export default class AddRecipient extends Component {
  static propTypes = {
    userInput: PropTypes.string,
    ownedAccounts: PropTypes.array,
    addressBook: PropTypes.array,
    updateRecipient: PropTypes.func,
    domainResolution: PropTypes.string,
    domainError: PropTypes.string,
    domainWarning: PropTypes.string,
    addressBookEntryName: PropTypes.string,
    contacts: PropTypes.array,
    nonContacts: PropTypes.array,
    addHistoryEntry: PropTypes.func,
    recipient: PropTypes.shape({
      address: PropTypes.string,
      nickname: PropTypes.string,
      error: PropTypes.string,
      warning: PropTypes.string,
    }),
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    domainType: PropTypes.string,
    resolvingSnap: PropTypes.string,
    ///: END:ONLY_INCLUDE_IF
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
      domainResolution,
      recipient,
      userInput,
      addressBookEntryName,
      ownedAccounts = [],
    } = this.props;

    let content;

    if (recipient.address) {
      content = this.renderExplicitAddress(
        recipient.address,
        recipient.nickname,
        'validated user input',
      );
    } else if (domainResolution && !recipient.error) {
      content = this.renderExplicitAddress(
        domainResolution,
        addressBookEntryName || userInput,
        'Domain resolution',
      );
      // TODO: Domain lookup fails silently, maybe we allow for a generic error message from snaps in the future?
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

  renderExplicitAddress(address, name, type) {
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    const { t } = this.context;
    const { domainType } = this.props;
    if (domainType === 'Other') {
      // Snap provided resolution.
      // Pulling the proposed name from the manifest,
      // because domain resolution isn't in stable + no hardcoded metadata to pull from.
      // TODO: If there are multiple resolutions (conflicts), we should render all of them
      const { resolvingSnap } = this.props;
      return (
        <div
          key={address}
          className="send__select-recipient-wrapper__group-item"
          onClick={() => this.selectRecipient(address, name, type)}
        >
          <Identicon address={address} diameter={28} />
          <div className="send__select-recipient-wrapper__group-item__content">
            <div className="send__select-recipient-wrapper__group-item__title">
              <Confusable input={name} />
              <Text paddingLeft={2}>{ellipsify(address)}</Text>
            </div>
            <div className="send__select-recipient-wrapper__group-item__subtitle">
              <Text paddingRight={1}>{t('suggestedBy')}</Text>
              <AvatarIcon
                iconName={IconName.Snaps}
                size={AvatarIconSize.Xs}
                backgroundColor={IconColor.infoDefault}
                marginRight={1}
                iconProps={{
                  color: IconColor.infoInverse,
                }}
              />
              <Text
                color={TextColor.infoDefault}
                style={{ textOverflow: 'ellipsis' }}
              >
                {resolvingSnap}
              </Text>
            </div>
          </div>
        </div>
      );
    }
    ///: END:ONLY_INCLUDE_IF
    return (
      <div
        key={address}
        className="send__select-recipient-wrapper__group-item"
        onClick={() => this.selectRecipient(address, name, type)}
      >
        <Identicon address={address} diameter={28} />
        <div className="send__select-recipient-wrapper__group-item__content">
          <div className="send__select-recipient-wrapper__group-item__title">
            {name ? <Confusable input={name} /> : ellipsify(address)}
          </div>
          {name && (
            <div className="send__select-recipient-wrapper__group-item__subtitle">
              {ellipsify(address)}
            </div>
          )}
        </div>
      </div>
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
