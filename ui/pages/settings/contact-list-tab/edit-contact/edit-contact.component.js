import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useNavigate } from 'react-router-dom-v5-compat';
import { AvatarAccountSize } from '@metamask/design-system-react';
import TextField from '../../../../components/ui/text-field';
import PageContainerFooter from '../../../../components/ui/page-container/page-container-footer';
import { PreferredAvatar } from '../../../../components/app/preferred-avatar';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../../shared/modules/hexstring-utils';
import {
  Button,
  ButtonVariant,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { isDuplicateContact } from '../../../../components/app/contact-list/utils';
import { getImageForChainId } from '../../../../selectors/multichain';
import { I18nContext } from '../../../../contexts/i18n';
import { ContactNetworks } from '../contact-networks';

export default function EditContact({
  addressBook,
  internalAccounts,
  networkConfigurations,
  addToAddressBook,
  removeFromAddressBook,
  name = '',
  address,
  contactChainId,
  memo = '',
  viewRoute,
  listRoute,
}) {
  const t = useContext(I18nContext);
  const navigate = useNavigate();
  const [contactName, setContactName] = useState(name);
  const [newAddress, setNewAddress] = useState(address);
  const [newMemo, setNewMemo] = useState(memo);
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState(contactChainId);
  const networks = networkConfigurations;
  const validateName = (nameValue) => {
    if (nameValue === name) {
      return true;
    }
    return !isDuplicateContact(addressBook, internalAccounts, nameValue);
  };

  const handleNameChange = (e) => {
    const nameValue = e.target.value;
    setNameError(validateName(nameValue) ? '' : t('nameAlreadyInUse'));
    setContactName(nameValue);
  };

  if (!address) {
    return <Navigate to={{ pathname: listRoute }} />;
  }

  return (
    <div
      className="settings-page__content-row address-book__edit-contact"
      data-testid="edit-contact"
    >
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
          <PreferredAvatar size={AvatarAccountSize.Lg} address={address} />
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
            variant={ButtonVariant.Link}
            danger
            style={{ display: 'contents' }}
            onClick={async () => {
              await removeFromAddressBook(contactChainId, address);
              navigate(listRoute);
            }}
            data-testid="delete-contact-button"
          >
            {t('deleteContact')}
          </Button>
        </Box>
      </Box>
      <div className="address-book__edit-contact__content">
        <div
          className="address-book__view-contact__group"
          data-testid="edit-contact-alias"
        >
          <div className="address-book__view-contact__group__label">
            {t('userName')}
          </div>
          <TextField
            id="nickname"
            placeholder={t('addAlias')}
            value={contactName}
            onChange={handleNameChange}
            error={nameError}
            fullWidth
            className="text-field-root"
            margin="dense"
          />
        </div>
        <div
          className="address-book__view-contact__group"
          data-testid="edit-contact-address"
        >
          <div className="address-book__view-contact__group__label">
            {t('ethereumPublicAddress')}
          </div>
          <TextField
            id="address"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            error={addressError}
            fullWidth
            multiline
            className="text-field-root"
            margin="dense"
          />
        </div>
        <div
          className="address-book__view-contact__group"
          data-testid="edit-contact-memo"
        >
          <div className="address-book__view-contact__group__label--capitalized">
            {t('memo')}
          </div>
          <TextField
            id="memo"
            placeholder={memo}
            value={newMemo}
            onChange={(e) => setNewMemo(e.target.value)}
            fullWidth
            multiline
            className="text-field-root"
            margin="dense"
          />
        </div>
        <div className="address-book__view-contact__group">
          <div className="address-book__view-contact__group__label">
            {t('network')}
          </div>
          <Box
            as="button"
            padding={3}
            display={Display.Flex}
            alignItems={AlignItems.center}
            backgroundColor={BackgroundColor.transparent}
            borderColor={BorderColor.borderDefault}
            justifyContent={JustifyContent.spaceBetween}
            borderRadius={BorderRadius.XL}
            onClick={() => setShowModal(true)}
            className="network-selector"
            data-testid="network-selector"
            marginTop={2}
          >
            <Box display={Display.Flex} gap={2}>
              <AvatarNetwork
                size={AvatarNetworkSize.Sm}
                src={getImageForChainId(selectedChainId) || undefined}
                name={networks?.[selectedChainId]?.name}
              />
              <Text>{networks?.[selectedChainId]?.name}</Text>
            </Box>
            <Icon
              name={IconName.ArrowDown}
              color={IconColor.iconDefault}
              size={IconSize.Sm}
            />
          </Box>
        </div>
      </div>
      <PageContainerFooter
        cancelText={t('cancel')}
        onSubmit={async () => {
          const isChainChanged = selectedChainId !== contactChainId;

          if (newAddress && newAddress !== address) {
            if (
              !isBurnAddress(newAddress) &&
              isValidHexAddress(newAddress, { mixedCaseUseChecksum: true })
            ) {
              await removeFromAddressBook(contactChainId, address);
              await addToAddressBook(
                newAddress,
                contactName || name,
                newMemo || memo,
                selectedChainId,
              );
              navigate(listRoute);
            } else {
              setAddressError(t('invalidAddress'));
            }
          } else if (isChainChanged) {
            await removeFromAddressBook(contactChainId, address);
            await addToAddressBook(
              address,
              contactName || name,
              newMemo || memo,
              selectedChainId,
            );
            navigate(listRoute);
          } else {
            await addToAddressBook(
              address,
              contactName || name,
              newMemo || memo,
              selectedChainId,
            );
            navigate(listRoute);
          }
        }}
        onCancel={() => navigate(`${viewRoute}/${address}`)}
        submitText={t('save')}
        disabled={Boolean(
          (contactName === name &&
            newAddress === address &&
            selectedChainId === contactChainId &&
            newMemo === memo) ||
            !contactName.trim() ||
            nameError,
        )}
      />
      {showModal && (
        <ContactNetworks
          isOpen
          onClose={() => setShowModal(false)}
          selectedChainId={selectedChainId}
          onSelect={(chainId) => setSelectedChainId(chainId)}
        />
      )}
    </div>
  );
}

EditContact.propTypes = {
  addressBook: PropTypes.array,
  internalAccounts: PropTypes.array,
  networkConfigurations: PropTypes.array,
  addToAddressBook: PropTypes.func.isRequired,
  removeFromAddressBook: PropTypes.func.isRequired,
  name: PropTypes.string,
  address: PropTypes.string.isRequired,
  contactChainId: PropTypes.string,
  memo: PropTypes.string,
  viewRoute: PropTypes.string.isRequired,
  listRoute: PropTypes.string.isRequired,
};
