import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { Redirect, useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
import { AssetPickerModalNetwork } from '../../../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-network';
import { I18nContext } from '../../../../contexts/i18n';
import { setActiveNetworkWithError } from '../../../../store/actions';

const EditContact = ({
  addressBook,
  internalAccounts,
  networks,
  addToAddressBook,
  removeFromAddressBook,
  name = '',
  address,
  chainId,
  memo = '',
  viewRoute,
  listRoute,
}) => {
  const t = useContext(I18nContext);
  const history = useHistory();
  const dispatch = useDispatch();
  const [contactName, setContactName] = useState(name);
  const [newAddress, setNewAddress] = useState(address);
  const [newMemo, setNewMemo] = useState(memo);
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [showModal, setShowModal] = useState(false);

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
          paddingRight={2}
        >
          <AvatarAccount size={AvatarAccountSize.Lg} address={address} />
          <Text
            variant={TextVariant.bodyLgMedium}
            marginInlineStart={4}
            ellipsis
          >
            {name || address}
          </Text>
        </Box>
        <Button
          type="link"
          onClick={async () => {
            await removeFromAddressBook(chainId, address);
            history.push(listRoute);
          }}
        >
          {t('deleteContact')}
        </Button>
      </Box>
      <div className="address-book__edit-contact__content">
        <div className="address-book__view-contact__group">
          <div className="address-book__view-contact__group__label">
            {t('userName')}
          </div>
          <TextField
            id="nickname"
            value={contactName}
            onChange={handleNameChange}
            error={nameError}
            fullWidth
            className="text-field-root"
          />
        </div>
        <div className="address-book__view-contact__group">
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
          />
        </div>
        <div className="address-book__view-contact__group">
          <div className="address-book__view-contact__group__label">
            {t('memo')}
          </div>
          <TextField
            id="memo"
            value={newMemo}
            onChange={(e) => setNewMemo(e.target.value)}
            fullWidth
            multiline
            className="text-field-root"
          />
        </div>
        <div className="address-book__view-contact__group">
          <div className="address-book__view-contact__group__label">
            {t('network')}
          </div>
          <Box
            as="button"
            padding={4}
            display={Display.Flex}
            alignItems={AlignItems.center}
            backgroundColor={BackgroundColor.transparent}
            borderColor={BorderColor.borderDefault}
            justifyContent={JustifyContent.spaceBetween}
            borderRadius={BorderRadius.XL}
            onClick={() => setShowModal(true)}
            className="network-selector"
          >
            <Box display={Display.Flex} gap={2}>
              <AvatarNetwork
                size={AvatarNetworkSize.Sm}
                src={getImageForChainId(chainId) || undefined}
              />
              <Text>{networks?.[chainId]?.name}</Text>
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
          if (newAddress && newAddress !== address) {
            if (
              !isBurnAddress(newAddress) &&
              isValidHexAddress(newAddress, { mixedCaseUseChecksum: true })
            ) {
              await removeFromAddressBook(chainId, address);
              await addToAddressBook(
                newAddress,
                contactName || name,
                newMemo || memo,
              );
              history.push(listRoute);
            } else {
              setAddressError(t('invalidAddress'));
            }
          } else {
            await addToAddressBook(
              address,
              contactName || name,
              newMemo || memo,
            );
            history.push(listRoute);
          }
        }}
        onCancel={() => history.push(`${viewRoute}/${address}`)}
        submitText={t('save')}
        disabled={!contactName.trim() || nameError}
      />
      {showModal && (
        <AssetPickerModalNetwork
          isOpen
          onClose={() => setShowModal(false)}
          selectedChainIds={Object.keys(networks)}
          onNetworkChange={(networkConfig) => {
            console.log(networkConfig, 'networkClientId');
            dispatch(
              setActiveNetworkWithError(
                networkConfig.rpcEndpoints[
                  networkConfig.defaultRpcEndpointIndex
                ].networkClientId || networkConfig.chainId,
              ),
            );
          }}
        />
      )}
    </div>
  );
};

EditContact.propTypes = {
  addressBook: PropTypes.array,
  internalAccounts: PropTypes.array,
  networks: PropTypes.array,
  addToAddressBook: PropTypes.func.isRequired,
  removeFromAddressBook: PropTypes.func.isRequired,
  name: PropTypes.string,
  address: PropTypes.string.isRequired,
  chainId: PropTypes.string,
  memo: PropTypes.string,
  viewRoute: PropTypes.string.isRequired,
  listRoute: PropTypes.string.isRequired,
};

export default EditContact;
