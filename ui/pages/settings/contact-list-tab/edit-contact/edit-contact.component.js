import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import Button from '../../../../components/ui/button/button.component';
import TextField from '../../../../components/ui/text-field';
import PageContainerFooter from '../../../../components/ui/page-container/page-container-footer';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../../shared/modules/hexstring-utils';
import {
  AvatarAccount,
  AvatarAccountSize,
  Box,
  Text,
} from '../../../../components/component-library';

import {
  AlignItems,
  BlockSize,
  Display,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { isDuplicateContact } from '../../../../components/app/contact-list/utils';

export default class EditContact extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    addressBook: PropTypes.array,
    internalAccounts: PropTypes.array,
    addToAddressBook: PropTypes.func,
    removeFromAddressBook: PropTypes.func,
    history: PropTypes.object,
    name: PropTypes.string,
    address: PropTypes.string,
    chainId: PropTypes.string,
    memo: PropTypes.string,
    viewRoute: PropTypes.string,
    listRoute: PropTypes.string,
  };

  static defaultProps = {
    name: '',
    memo: '',
  };

  state = {
    newName: this.props.name,
    newAddress: this.props.address,
    newMemo: this.props.memo,
    nameError: '',
    addressError: '',
  };

  validateName = (newName) => {
    if (newName === this.props.name) {
      return true;
    }

    const { addressBook, internalAccounts } = this.props;

    return !isDuplicateContact(addressBook, internalAccounts, newName);
  };

  handleNameChange = (e) => {
    const newName = e.target.value;

    const isValidName = this.validateName(newName);

    this.setState({
      nameError: isValidName ? null : this.context.t('nameAlreadyInUse'),
    });

    this.setState({ newName });
  };

  render() {
    const { t } = this.context;
    const {
      address,
      addToAddressBook,
      chainId,
      history,
      listRoute,
      memo,
      name,
      removeFromAddressBook,
      viewRoute,
    } = this.props;

    if (!address) {
      return <Redirect to={{ pathname: listRoute }} />;
    }

    return (
      <div className="settings-page__content-row address-book__edit-contact">
        <Box
          className="settings-page__header address-book__header--edit"
          paddingLeft={6}
          paddingRight={6}
          width={BlockSize.Full}
          alignItems={AlignItems.center}
        >
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            style={{ overflow: 'hidden' }}
            paddingRight={2}
          >
            <AvatarAccount size={AvatarAccountSize.Lg} address={address} />
            <Text
              className="address-book__header__name"
              variant={TextVariant.bodyLgMedium}
              marginInlineStart={4}
              style={{ overflow: 'hidden' }}
              ellipsis
            >
              {name || address}
            </Text>
          </Box>
          <Box className="settings-page__address-book-button">
            <Button
              type="link"
              onClick={async () => {
                await removeFromAddressBook(chainId, address);
                history.push(listRoute);
              }}
              style={{ display: 'contents' }}
            >
              {t('deleteContact')}
            </Button>
          </Box>
        </Box>
        <div className="address-book__edit-contact__content">
          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              {t('userName')}
            </div>
            <TextField
              type="text"
              id="nickname"
              placeholder={this.context.t('addAlias')}
              value={this.state.newName}
              onChange={this.handleNameChange}
              fullWidth
              margin="dense"
              error={this.state.nameError}
            />
          </div>

          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              {t('ethereumPublicAddress')}
            </div>
            <TextField
              type="text"
              id="address"
              value={this.state.newAddress}
              error={this.state.addressError}
              onChange={(e) => this.setState({ newAddress: e.target.value })}
              fullWidth
              multiline
              rows={4}
              margin="dense"
              classes={{
                inputMultiline:
                  'address-book__view-contact__address__text-area',
                inputRoot: 'address-book__view-contact__address',
              }}
            />
          </div>

          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label--capitalized">
              {t('memo')}
            </div>
            <TextField
              type="text"
              id="memo"
              placeholder={memo}
              value={this.state.newMemo}
              onChange={(e) => this.setState({ newMemo: e.target.value })}
              fullWidth
              margin="dense"
              multiline
              rows={3}
              classes={{
                inputMultiline: 'address-book__view-contact__text-area',
                inputRoot: 'address-book__view-contact__text-area-wrapper',
              }}
            />
          </div>
        </div>
        <PageContainerFooter
          cancelText={this.context.t('cancel')}
          onSubmit={async () => {
            if (
              this.state.newAddress !== '' &&
              this.state.newAddress !== address
            ) {
              // if the user makes a valid change to the address field, remove the original address
              if (
                !isBurnAddress(this.state.newAddress) &&
                isValidHexAddress(this.state.newAddress, {
                  mixedCaseUseChecksum: true,
                })
              ) {
                await removeFromAddressBook(chainId, address);
                await addToAddressBook(
                  this.state.newAddress,
                  this.state.newName || name,
                  this.state.newMemo || memo,
                );
                history.push(listRoute);
              } else {
                this.setState({
                  addressError: this.context.t('invalidAddress'),
                });
              }
            } else {
              // update name
              await addToAddressBook(
                address,
                this.state.newName || name,
                this.state.newMemo || memo,
              );
              history.push(listRoute);
            }
          }}
          onCancel={() => {
            history.push(`${viewRoute}/${address}`);
          }}
          submitText={this.context.t('save')}
          disabled={Boolean(
            (this.state.newName === name &&
              this.state.newAddress === address &&
              this.state.newMemo === memo) ||
              !this.state.newName.trim() ||
              this.state.nameError,
          )}
        />
      </div>
    );
  }
}
