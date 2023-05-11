import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ContactList from '../../../components/app/contact-list';
import {
  BUTTON_VARIANT,
  BannerAlert,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import { Button } from '../../../components/component-library/button/button';
import Box from '../../../components/ui/box';
import Dropdown from '../../../components/ui/dropdown';
import {
  AlignItems,
  DISPLAY,
  IconColor,
  JustifyContent,
  SEVERITIES,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  CONTACT_ADD_ROUTE,
  CONTACT_VIEW_ROUTE,
} from '../../../helpers/constants/routes';
import { exportAsFile } from '../../../helpers/utils/export-utils';
import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import AddContact from './add-contact';
import EditContact from './edit-contact';
import ViewContact from './view-contact';

const CORRUPT_JSON_FILE = 'CORRUPT_JSON_FILE';

export default class ContactListTab extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    addressBook: PropTypes.array,
    history: PropTypes.object,
    selectedAddress: PropTypes.string,
    viewingContact: PropTypes.bool,
    editingContact: PropTypes.bool,
    addingContact: PropTypes.bool,
    showContactContent: PropTypes.bool,
    hideAddressBook: PropTypes.bool,
    exportContactList: PropTypes.func.isRequired,
    importContactList: PropTypes.func.isRequired,
    showClearContactListModal: PropTypes.func.isRequired,
  };

  state = {
    isVisibleResultMessage: false,
    isImportSuccessful: true,
    importMessage: null,
    filterType: 'showAll',
  };

  types = {
    showAll: 'Show All Contacts',
    allowList: 'Allow List Contacts',
    blockList: 'Block List Contacts',
  };

  settingsRefs = Array(
    getNumberOfSettingsInSection(this.context.t, this.context.t('contacts')),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef();
    });

  componentDidUpdate() {
    const { t } = this.context;
    handleSettingsRefs(t, t('contacts'), this.settingsRefs);
  }

  componentDidMount() {
    const { t } = this.context;
    handleSettingsRefs(t, t('contacts'), this.settingsRefs);
  }

  async getTextFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new window.FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        resolve(text);
      };

      reader.onerror = (e) => {
        reject(e);
      };

      reader.readAsText(file);
    });
  }

  async importContactList(event) {
    /**
     * we need this to be able to access event.target after
     * the event handler has been called. [Synthetic Event Pooling, pre React 17]
     *
     * @see https://fb.me/react-event-pooling
     */
    event.persist();
    const file = event.target.files[0];
    const jsonString = await this.getTextFromFile(file);
    /**
     * so that we can restore same file again if we want to.
     * chrome blocks uploading same file twice.
     */
    event.target.value = '';

    try {
      const result = await this.props.importContactList(jsonString, file.name);

      this.setState({
        isVisibleResultMessage: true,
        isImportSuccessful: result,
        importMessage: null,
      });
    } catch (e) {
      if (e.message.match(/Unexpected.+JSON/iu)) {
        this.setState({
          isVisibleResultMessage: true,
          isImportSuccessful: false,
          importMessage: CORRUPT_JSON_FILE,
        });
      }
    }
  }

  async exportContactList() {
    const { fileName, data } = await this.props.exportContactList();

    exportAsFile(fileName, data);

    this.context.trackEvent({
      event: 'Contact list exported',
      category: 'Backup',
      properties: {},
    });
  }

  renderImportExportButtons() {
    const { isVisibleResultMessage, isImportSuccessful, importMessage } =
      this.state;

    const defaultImportMessage = isImportSuccessful
      ? 'Contact list import successful'
      : 'Contact list import failed';

    const restoreMessageToRender =
      importMessage === CORRUPT_JSON_FILE
        ? 'Contact list seems corrupt'
        : defaultImportMessage;

    return (
      <>
        <Box className="btn-wrapper" display="flex" flexDirection="column">
          <Button
            data-testid="export-contacts"
            variant={BUTTON_VARIANT.PRIMARY}
            onClick={() => this.exportContactList()}
          >
            Export contact list
          </Button>
          <label
            htmlFor="import-contact-list"
            className="button btn btn--rounded btn-secondary btn--large settings-page__button import-btn"
            style={{ marginTop: '16px', marginBottom: '16px' }}
          >
            Import contact list
          </label>
          <input
            id="import-contact-list"
            data-testid="import-contact-list"
            type="file"
            accept=".json"
            onChange={(e) => this.importContactList(e)}
          />
          {isVisibleResultMessage && (
            <BannerAlert
              severity={
                isImportSuccessful ? SEVERITIES.SUCCESS : SEVERITIES.DANGER
              }
              description={restoreMessageToRender}
              onClose={() => {
                this.setState({
                  isVisibleResultMessage: false,
                  isImportSuccessful: true,
                  importMessage: null,
                });
              }}
            />
          )}
          <Button
            data-testid="clear-contacts"
            variant={BUTTON_VARIANT.LINK}
            onClick={() => this.props.showClearContactListModal()}
          >
            Clear contact list
          </Button>
        </Box>
      </>
    );
  }

  renderAddresses() {
    const { addressBook, history, selectedAddress } = this.props;
    const filteredOptions = Object.keys(this.types).map((value) => ({
      value,
      name: this.types[value],
    }));
    const filteredAddress =
      this.state.filterType === 'showAll'
        ? addressBook
        : addressBook.filter((item) =>
            item.tags.includes(this.state.filterType),
          );
    const contacts = filteredAddress.filter(({ name }) => Boolean(name));
    const nonContacts = filteredAddress.filter(({ name }) => !name);
    const { t } = this.context;

    if (filteredAddress.length) {
      return (
        <div>
          <Box
            marginTop={4}
            marginBottom={4}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            gap={4}
            marginRight={6}
            justifyContent={JustifyContent.flexEnd}
          >
            <Text>Filter By</Text>
            <Dropdown
              className=""
              options={filteredOptions}
              onChange={(e) => {
                this.setState({ filterType: e });
              }}
              selectedOption={this.state.filterType}
            />
          </Box>
          <ContactList
            searchForContacts={() => contacts}
            searchForRecents={() => nonContacts}
            selectRecipient={(address) => {
              history.push(`${CONTACT_VIEW_ROUTE}/${address}`);
            }}
            selectedAddress={selectedAddress}
          />
        </div>
      );
    }
    if (addressBook.length > 0 && filteredAddress.length < 1) {
      return (
        <div>
          <Box
            marginTop={4}
            marginBottom={4}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            gap={4}
            marginRight={6}
            justifyContent={JustifyContent.flexEnd}
          >
            <Text>Filter By</Text>
            <Dropdown
              className=""
              options={filteredOptions}
              onChange={(e) => {
                this.setState({ filterType: e });
              }}
              selectedOption={this.state.filterType}
            />
          </Box>
          <BannerAlert
            severity="warning"
            title="Warning"
            marginBottom={4}
            marginTop={4}
          >
            No matching accounts for this filter
          </BannerAlert>
          <ContactList
            searchForContacts={() => contacts}
            searchForRecents={() => nonContacts}
            selectRecipient={(address) => {
              history.push(`${CONTACT_VIEW_ROUTE}/${address}`);
            }}
            selectedAddress={selectedAddress}
          />
        </div>
      );
    }
    return (
      <div className="address-book__container">
        <div>
          <Icon
            name={IconName.Book}
            color={IconColor.iconMuted}
            className="address-book__icon"
            size={IconSize.Xl}
          />
          <h4 className="address-book__title">{t('buildContactList')}</h4>
          <p className="address-book__sub-title">
            {t('addFriendsAndAddresses')}
          </p>
          <button
            className="address-book__link"
            onClick={() => {
              history.push(CONTACT_ADD_ROUTE);
            }}
          >
            + {t('addContact')}
          </button>
        </div>
      </div>
    );
  }

  renderAddButton() {
    const { history, viewingContact, editingContact } = this.props;

    return (
      <div className="address-book-add-button">
        <Button
          className={classnames({
            'address-book-add-button__button': true,
            'address-book-add-button__button--hidden':
              viewingContact || editingContact,
          })}
          type="primary"
          onClick={() => {
            history.push(CONTACT_ADD_ROUTE);
          }}
        >
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            color={TextColor.overlayInverse}
          >
            {this.context.t('addContact')}
          </Text>
        </Button>
      </div>
    );
  }

  renderContactContent() {
    const {
      viewingContact,
      editingContact,
      addingContact,
      showContactContent,
    } = this.props;

    if (!showContactContent) {
      return null;
    }

    let ContactContentComponent = null;
    if (viewingContact) {
      ContactContentComponent = ViewContact;
    } else if (editingContact) {
      ContactContentComponent = EditContact;
    } else if (addingContact) {
      ContactContentComponent = AddContact;
    }

    return (
      ContactContentComponent && (
        <div className="address-book-contact-content">
          <ContactContentComponent />
        </div>
      )
    );
  }

  renderAddressBookContent() {
    const { hideAddressBook } = this.props;

    if (!hideAddressBook) {
      return (
        <div ref={this.settingsRefs[0]} className="address-book">
          {this.renderAddresses()}
          {this.renderImportExportButtons()}
        </div>
      );
    }
    return null;
  }

  render() {
    const { addingContact, addressBook } = this.props;

    return (
      <div className="address-book-wrapper">
        {this.renderAddressBookContent()}
        {this.renderContactContent()}
        {!addingContact && addressBook.length > 0
          ? this.renderAddButton()
          : null}
      </div>
    );
  }
}
