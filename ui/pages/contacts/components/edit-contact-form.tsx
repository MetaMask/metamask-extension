import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarIcon,
  AvatarIconSize,
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
  IconColor,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import {
  FormTextField,
  FormTextFieldSize,
  SelectButton,
  SelectButtonSize,
} from '../../../components/component-library';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import { ContactNetworks } from '../../settings/contact-list-tab/contact-networks';
import { getImageForChainId } from '../../../selectors/multichain';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import {
  addToAddressBook,
  removeFromAddressBook,
} from '../../../store/actions';
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

  const selectedNetwork =
    networks && selectedChainId
      ? (networks as Record<string, { name?: string }>)[selectedChainId]
      : undefined;
  const selectedNetworkName =
    selectedNetwork?.name ??
    (selectedChainId
      ? `${t('unknownNetworkForGatorPermissions')} (${selectedChainId})`
      : t('network'));
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
    <Box className="flex min-h-0 w-full flex-1 flex-col justify-between">
      <Box
        className="flex min-h-0 w-full flex-col overflow-auto px-4 pt-4 gap-6"
        style={{ scrollbarColor: 'var(--color-icon-muted) transparent' }}
      >
        {/* Avatar */}
        <Box className="flex flex-col items-center">
          <BadgeWrapper
            badge={
              <AvatarIcon
                className="rounded-md border-2 border-background-default bg-primary-default"
                size={AvatarIconSize.Sm}
                iconName={IconName.Edit}
                iconProps={{ color: IconColor.PrimaryInverse }}
              />
            }
          >
            <AvatarAccount address={address} size={AvatarAccountSize.Xl} />
          </BadgeWrapper>
        </Box>

        {/* Form fields */}
        <Box className="flex w-full flex-col gap-6">
          <Box className="flex w-full justify-end">
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
            size={FormTextFieldSize.Lg}
            labelProps={{ marginBottom: 1 }}
            textFieldProps={{
              backgroundColor: BackgroundColor.backgroundMuted,
              borderColor: BorderColor.borderDefault,
              borderRadius: BorderRadius.XL,
            }}
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
            size={FormTextFieldSize.Lg}
            labelProps={{ marginBottom: 1 }}
            textFieldProps={{
              backgroundColor: BackgroundColor.backgroundMuted,
              borderColor: BorderColor.borderDefault,
              borderRadius: BorderRadius.XL,
            }}
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
            size={FormTextFieldSize.Lg}
            labelProps={{ marginBottom: 1 }}
            textFieldProps={{
              backgroundColor: BackgroundColor.backgroundMuted,
              borderColor: BorderColor.borderDefault,
              borderRadius: BorderRadius.XL,
            }}
            data-testid="address-book-edit-contact-memo"
          />

          <Box className="w-full">
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
              className="mb-1"
            >
              {t('network')}
            </Text>
            <SelectButton
              size={SelectButtonSize.Lg}
              isBlock
              backgroundColor={BackgroundColor.backgroundMuted}
              borderColor={BorderColor.borderDefault}
              borderRadius={BorderRadius.XL}
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
              className="rounded-xl"
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
        </Box>
      </Box>

      {/* Footer */}
      <Box className="mb-6 shrink-0 bg-background-default px-4 pb-6 pt-0">
        <Box className="flex gap-4">
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border-default"
            data-testid="page-container-footer-cancel"
          >
            {t('cancel')}
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isDisabled={isSaveDisabled}
            onClick={handleSubmit}
            className="flex-1 rounded-xl"
            data-testid="page-container-footer-next"
          >
            {t('save')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
