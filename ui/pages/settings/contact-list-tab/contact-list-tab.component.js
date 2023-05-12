import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ContactList from '../../../components/app/contact-list';
import {
  BannerAlert,
  Icon,
  IconName,
  IconSize,
  Text,
  ButtonIcon,
  ButtonLink,
} from '../../../components/component-library';
import { Button } from '../../../components/component-library/button/button';
import Box from '../../../components/ui/box';
import CheckBox, {
  CHECKED,
  INDETERMINATE,
  UNCHECKED,
} from '../../../components/ui/check-box';
import Dropdown from '../../../components/ui/dropdown';
import Tooltip from '../../../components/ui/tooltip';
import {
  AlignItems,
  Color,
  DISPLAY,
  FLEX_DIRECTION,
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
    chainId: PropTypes.string,
    removeFromAddressBook: PropTypes.func,
    addToAddressBook: PropTypes.func,
  };

  state = {
    isVisibleResultMessage: false,
    isImportSuccessful: true,
    importMessage: null,
    filterType: 'showAll',
    selectedAccounts: new Set(),
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
        <Box
          display={DISPLAY.FLEX}
          flexDirection={[FLEX_DIRECTION.COLUMN, FLEX_DIRECTION.ROW]}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.spaceBetween}
          className="btn-wrapper"
          gap={4}
          padding={5}
        >
          <ButtonLink
            data-testid="export-contacts"
            startIconName={IconName.Export}
            onClick={() => this.exportContactList()}
          >
            Export contact list
          </ButtonLink>
          <label
            htmlFor="import-contact-list"
            className="import-button"
            style={{ marginTop: '16px', marginBottom: '16px' }}
          >
            <Icon name={IconName.Import} />
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
          <ButtonLink
            data-testid="clear-contacts"
            startIconName={IconName.Close}
            onClick={() => this.props.showClearContactListModal()}
          >
            Clear contact list
          </ButtonLink>
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
    console.log('nickname', filteredAddress);
    const contacts = filteredAddress.filter(({ name }) => Boolean(name));
    const nonContacts = filteredAddress.filter(({ name }) => !name);

    const handleAccountClick = (address) => {
      const newSelectedAccounts = new Set(this.state.selectedAccounts);
      console.log(newSelectedAccounts, 'nidhi');
      if (newSelectedAccounts.has(address)) {
        newSelectedAccounts.delete(address);
      } else {
        newSelectedAccounts.add(address);
      }
      this.setState({ selectedAccounts: newSelectedAccounts });
    };

    const deleteAccounts = () => {
      let address;
      // eslint-disable-next-line guard-for-in
      for (address of this.state.selectedAccounts) {
        console.log(address, 'address');
        this.props.removeFromAddressBook(this.props.chainId, address);
      }
    };

    const addToAllowList = () => {
      for (const address of this.state.selectedAccounts) {
        console.log(address, 'address');
        const filteredName = filteredAddress.find(
          (contact) => contact.address === address,
        ).name;
        console.log(filteredName, 'nidhi');
        filteredName &&
          this.props.addToAddressBook(address, filteredName, '', ['allowList']);
      }
    };

    const addToBlockList = () => {
      for (const address of this.state.selectedAccounts) {
        console.log(address, 'address');
        const filteredName = filteredAddress.find(
          (contact) => contact.address === address,
        ).name;
        console.log(filteredName, 'nidhi');
        filteredName &&
          this.props.addToAddressBook(address, filteredName, '', ['blockList']);
      }
    };

    const selectAll = () => {
      const newSelectedAccounts = new Set(
        filteredAddress.map((account) => account.address),
      );
      this.setState({ selectedAccounts: newSelectedAccounts });
      console.log(this.state.selectedAccounts, 'hello');
    };

    const deselectAll = () => {
      this.setState({ selectedAccounts: new Set() });
      console.log(this.state.selectedAccounts, 'hiii');
    };

    const allAreSelected = () => {
      console.log(this.state.selectedAccounts, 'yooo');
      return filteredAddress.length === this.state.selectedAccounts?.size;
    };

    let checked;
    if (allAreSelected()) {
      checked = CHECKED;
    } else if (this.selectedAccounts?.size === 0) {
      checked = UNCHECKED;
    } else {
      checked = INDETERMINATE;
    }
    const { t } = this.context;

    if (filteredAddress.length) {
      return (
        <div>
          <Box
            marginTop={4}
            marginBottom={4}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Box
              alignItems={AlignItems.center}
              gap={4}
              marginLeft={4}
              display={DISPLAY.FLEX}
            >
              <CheckBox
                className="choose-account-list__header-check-box"
                checked={checked}
                onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
              />
              <Box
                display={
                  this.state.selectedAccounts.size ? DISPLAY.FLEX : DISPLAY.NONE
                }
                alignItems={AlignItems.center}
                gap={4}
              >
                <Tooltip position="bottom" title="Delete">
                  <ButtonIcon
                    iconName={IconName.Trash}
                    ariaLabel="delete"
                    data-testid="delete"
                    onClick={() => deleteAccounts()}
                    color={Color.iconDefault}
                  />
                </Tooltip>
                <Tooltip position="bottom" title="Add to Allow List">
                  <ButtonIcon
                    iconName={IconName.AddSquare}
                    ariaLabel="add"
                    data-testid="add"
                    onClick={() => addToAllowList()}
                    color={Color.successDefault}
                  />
                </Tooltip>
                <Tooltip position="bottom" title="Add to Block List">
                  <ButtonIcon
                    iconName={IconName.AddSquare}
                    ariaLabel="block"
                    data-testid="block"
                    onClick={() => addToBlockList()}
                    color={Color.errorDefault}
                  />
                </Tooltip>
              </Box>
            </Box>
            <Box
              display={DISPLAY.FLEX}
              alignItems={AlignItems.center}
              gap={4}
              marginRight={6}
              justifyContent={JustifyContent.flexEnd}
            >
              <Dropdown
                className=""
                options={filteredOptions}
                onChange={(e) => {
                  this.setState({ filterType: e });
                }}
                selectedOption={this.state.filterType}
              />
            </Box>
          </Box>
          <ContactList
            searchForContacts={() => contacts}
            searchForRecents={() => nonContacts}
            selectRecipient={(address) => {
              history.push(`${CONTACT_VIEW_ROUTE}/${address}`);
            }}
            selectedAddress={selectedAddress}
            selectedAccount={this.state.selectedAccounts}
            handleAccountClick={handleAccountClick}
            deleteAccounts={deleteAccounts}
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
