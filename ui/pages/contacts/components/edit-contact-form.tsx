import React, { useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  FormTextField,
  FormTextFieldSize,
} from '../../../components/component-library';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
} from '../../../helpers/constants/design-system';
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
import type { EditContactFormProps } from '../contacts.types';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

export function EditContactForm({
  address,
  initialName,
  initialMemo,
  contactChainId,
  onCancel,
  onSuccess,
}: EditContactFormProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const addressBook = useSelector(getAddressBook);
  const internalAccounts = useSelector(getInternalAccounts);
  const networks = useSelector(getNetworkConfigurationsByChainId);

  const [contactName, setContactName] = useState(initialName);
  const [newAddress, setNewAddress] = useState(address);
  const [memo, setMemo] = useState(initialMemo);
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');

  const validateName = (nameValue: string) => {
    if (nameValue === initialName) {
      return true;
    }
    return !isDuplicateContact(addressBook, internalAccounts, nameValue);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameValue = e.target.value;
    setNameError(validateName(nameValue) ? '' : t('nameAlreadyInUse'));
    setContactName(nameValue);
  };

  const selectedNetwork =
    networks && contactChainId
      ? (networks as Record<string, { name?: string }>)[contactChainId]
      : undefined;
  const selectedNetworkName =
    selectedNetwork?.name ??
    (contactChainId
      ? `${t('unknownNetworkForGatorPermissions')} (${contactChainId})`
      : t('networkTabCustom'));

  const isUnchanged =
    contactName === initialName &&
    newAddress === address &&
    memo === initialMemo;
  const isSaveDisabled =
    !contactName.trim() ||
    Boolean(nameError) ||
    Boolean(addressError) ||
    isUnchanged;

  const handleSubmit = async () => {
    if (newAddress && newAddress !== address) {
      const valid =
        !isBurnAddress(newAddress) &&
        isValidHexAddress(newAddress, { mixedCaseUseChecksum: true });
      if (!valid) {
        setAddressError(t('invalidAddress'));
        return;
      }
      await dispatch(removeFromAddressBook(contactChainId, address));
      await dispatch(
        addToAddressBook(
          newAddress,
          contactName || initialName,
          memo,
          contactChainId,
        ),
      );
    } else {
      await dispatch(
        addToAddressBook(
          address,
          contactName || initialName,
          memo,
          contactChainId,
        ),
      );
    }
    trackEvent({
      category: MetaMetricsEventCategory.Contacts,
      event: MetaMetricsEventName.ContactUpdated,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: contactChainId,
      },
      sensitiveProperties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        contact_address: newAddress,
      },
    });
    onSuccess();
  };

  return (
    <Box className="flex h-full w-full flex-col justify-between gap-6">
      <Box
        className="flex w-full flex-col px-4 pt-4 gap-6"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
      >
        {/* Avatar */}
        <Box className="flex flex-col items-center">
          <AvatarAccount address={address} size={AvatarAccountSize.Xl} />
        </Box>

        {/* Form fields */}
        <Box className="flex w-full flex-col gap-6">
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
            truncate={false}
            labelProps={{ marginBottom: 1 }}
            textFieldProps={{
              backgroundColor: BackgroundColor.backgroundMuted,
              borderColor: BorderColor.borderDefault,
              borderRadius: BorderRadius.XL,
            }}
            data-testid="address-book-edit-contact-address"
          />

          {initialMemo.length > 0 && (
            <FormTextField
              id="edit-contact-memo"
              label={t('memo')}
              placeholder={t('addMemo')}
              value={memo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMemo(e.target.value)
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
          )}

          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={1}
            className="flex w-full flex-col"
          >
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
              className="mb-1"
            >
              {t('network')}
            </Text>
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={2}
              padding={4}
              className="flex h-12 items-center rounded-xl border border-border-muted bg-background-muted"
              style={{ cursor: 'not-allowed' }}
            >
              <AvatarNetwork
                size={AvatarNetworkSize.Xs}
                src={
                  contactChainId
                    ? getImageForChainId(contactChainId) || undefined
                    : undefined
                }
                name={selectedNetworkName}
              />
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextDefault}
                ellipsis
                className="min-w-0 flex-1"
              >
                {selectedNetworkName}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={4}
        padding={4}
        paddingBottom={6}
        className="flex flex-row"
      >
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
  );
}
