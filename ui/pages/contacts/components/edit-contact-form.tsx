import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import {
  FormTextField,
  SelectButton,
  SelectButtonSize,
  AvatarNetwork,
  AvatarNetworkSize,
  Label,
} from '../../../components/component-library';
import { ContactNetworks } from '../../settings/contact-list-tab/contact-networks';
import { getImageForChainId } from '../../../selectors/multichain';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { addToAddressBook, removeFromAddressBook } from '../../../store/actions';
import { getAddressBook, getInternalAccounts } from '../../../selectors';
import { isDuplicateContact } from '../../../components/app/contact-list/utils';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../shared/modules/hexstring-utils';

type EditContactFormProps = {
  address: string;
  initialName: string;
  initialMemo: string;
  contactChainId: string;
  onCancel: () => void;
  onSuccess: () => void;
  onDelete: () => void;
};

export function EditContactForm({
  address,
  initialName,
  initialMemo,
  contactChainId,
  onCancel,
  onSuccess,
  onDelete,
}: EditContactFormProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const addressBook = useSelector(getAddressBook);
  const internalAccounts = useSelector(getInternalAccounts);
  const networks = useSelector(getNetworkConfigurationsByChainId);

  const [contactName, setContactName] = useState(initialName);
  const [newAddress, setNewAddress] = useState(address);
  const [newMemo, setNewMemo] = useState(initialMemo);
  const [selectedChainId, setSelectedChainId] = useState(contactChainId);
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const validateName = (nameValue: string) => {
    if (nameValue === initialName) return true;
    return !isDuplicateContact(addressBook, internalAccounts, nameValue);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameValue = e.target.value;
    setNameError(validateName(nameValue) ? '' : t('nameAlreadyInUse'));
    setContactName(nameValue);
  };

  const selectedNetworkName =
    (networks && selectedChainId
      ? (networks as Record<string, { name?: string }>)[selectedChainId]?.name
      : undefined) ?? t('network');
  const isUnchanged =
    contactName === initialName &&
    newAddress === address &&
    selectedChainId === contactChainId &&
    newMemo === initialMemo;
  const isSaveDisabled =
    !contactName.trim() || Boolean(nameError) || isUnchanged;

  const handleSubmit = async () => {
    if (newAddress && newAddress !== address) {
      const valid =
        !isBurnAddress(newAddress) &&
        isValidHexAddress(newAddress, { mixedCaseUseChecksum: true });
      if (valid) {
        await dispatch(removeFromAddressBook(contactChainId, address));
        await dispatch(
          addToAddressBook(
            newAddress,
            contactName || initialName,
            newMemo || initialMemo,
            selectedChainId,
          ),
        );
        onSuccess();
      } else {
        setAddressError(t('invalidAddress'));
      }
    } else if (selectedChainId !== contactChainId) {
      await dispatch(removeFromAddressBook(contactChainId, address));
      await dispatch(
        addToAddressBook(
          address,
          contactName || initialName,
          newMemo || initialMemo,
          selectedChainId,
        ),
      );
      onSuccess();
    } else {
      await dispatch(
        addToAddressBook(
          address,
          contactName || initialName,
          newMemo || initialMemo,
          selectedChainId,
        ),
      );
      onSuccess();
    }
  };

  const handleDelete = async () => {
    await dispatch(removeFromAddressBook(contactChainId, address));
    onDelete();
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      padding={4}
      gap={4}
      className="flex flex-col"
    >
      <Box
        marginBottom={2}
        className="flex justify-end"
      >
        <Button
          variant={ButtonVariant.Tertiary}
          onClick={handleDelete}
          className="text-error-default"
          data-testid="delete-contact-button"
        >
          {t('deleteContact')}
        </Button>
      </Box>

      <FormTextField
        id="edit-contact-nickname"
        label={t('nickname')}
        placeholder={t('addAlias')}
        value={contactName}
        onChange={handleNameChange}
        error={Boolean(nameError)}
        helpText={nameError || undefined}
        data-testid="address-book-edit-contact-name"
      />

      <FormTextField
        id="edit-contact-address"
        label={t('publicAddress')}
        value={newAddress}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setNewAddress(e.target.value);
          setAddressError('');
        }}
        error={Boolean(addressError)}
        helpText={addressError || undefined}
        data-testid="address-book-edit-contact-address"
      />

      <FormTextField
        id="edit-contact-memo"
        label={t('memo')}
        placeholder={initialMemo}
        value={newMemo}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setNewMemo(e.target.value)
        }
        data-testid="address-book-edit-contact-memo"
      />

      <Box>
        <Label marginBottom={1}>{t('network')}</Label>
        <SelectButton
          size={SelectButtonSize.Md}
          isBlock
          startAccessory={
            <AvatarNetwork
              size={AvatarNetworkSize.Xs}
src={
              selectedChainId
                ? getImageForChainId(selectedChainId) || undefined
                : undefined
            }
            name={selectedNetworkName}
            />
          }
          onClick={() => setShowNetworkModal(true)}
          data-testid="network-selector"
        >
          {selectedNetworkName}
        </SelectButton>
      </Box>

      {showNetworkModal && (
        <ContactNetworks
          isOpen
          onClose={() => setShowNetworkModal(false)}
          selectedChainId={selectedChainId}
          onSelect={(chainId: string) => setSelectedChainId(chainId)}
        />
      )}

      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={2}
        marginTop={4}
        className="flex"
      >
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          onClick={onCancel}
          className="flex-1"
          data-testid="page-container-footer-cancel"
        >
          {t('cancel')}
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isDisabled={isSaveDisabled}
          onClick={handleSubmit}
          className="flex-1"
          data-testid="page-container-footer-next"
        >
          {t('save')}
        </Button>
      </Box>
    </Box>
  );
}
