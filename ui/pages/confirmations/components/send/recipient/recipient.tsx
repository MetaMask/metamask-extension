import React, { useCallback, useRef, useState, useEffect } from 'react';
import { AvatarAccountSize } from '@metamask/design-system-react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalContentSize,
  Text,
  TextField,
  IconName,
  ButtonIcon,
  ButtonIconSize,
  TextFieldSize,
  HelpText,
  HelpTextSeverity,
  Box,
} from '../../../../../components/component-library';
import {
  BlockSize,
  TextVariant,
  AlignItems,
  Display,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useRecipientSelectionMetrics } from '../../../hooks/send/metrics/useRecipientSelectionMetrics';
import { useRecipientValidation } from '../../../hooks/send/useRecipientValidation';
import { useSendContext } from '../../../context/send';
import { useRecipients } from '../../../hooks/send/useRecipients';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar';
import { RecipientList } from '../recipient-list';

export const Recipient = () => {
  const {
    recipientConfusableCharacters,
    recipientError,
    recipientWarning,
    recipientResolvedLookup,
    toAddressValidated,
  } = useRecipientValidation();
  const hasConfusableCharacters =
    recipientConfusableCharacters && recipientConfusableCharacters.length > 0;
  const t = useI18nContext();
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const { to, updateTo, updateToResolved } = useSendContext();
  const [localValue, setLocalValue] = useState(to || '');
  const {
    captureRecipientSelected,
    setRecipientInputMethodManual,
    setRecipientInputMethodSelectContact,
    setRecipientInputMethodSelectAccount,
  } = useRecipientSelectionMetrics();
  const recipients = useRecipients();
  const recipientInputRef = useRef<HTMLInputElement>(null);
  const closeRecipientModal = useCallback(() => {
    setIsRecipientModalOpen(false);
  }, []);

  const openRecipientModal = useCallback(() => {
    recipientInputRef.current?.blur();
    setIsRecipientModalOpen(true);
  }, []);

  const onToChange = useCallback(
    (address: string, isSelectedFromModal?: boolean) => {
      const toAddress = address;
      setLocalValue(toAddress);
      updateTo(toAddress);
      if (!isSelectedFromModal) {
        setRecipientInputMethodManual();
      }
    },
    [updateTo, setRecipientInputMethodManual],
  );

  const captureMetrics = useCallback(() => {
    if (!to) {
      return;
    }
    captureRecipientSelected();
  }, [captureRecipientSelected, to]);

  const clearRecipient = useCallback(() => {
    setLocalValue('');
    updateTo('');
  }, [updateTo]);

  const onRecipientSelectedFromModal = useCallback(
    (address: string) => {
      const isRecipientContact = recipients.some(
        (recipient) =>
          recipient.address.toLowerCase() === address.toLowerCase() &&
          recipient.contactName,
      );
      if (isRecipientContact) {
        setRecipientInputMethodSelectContact();
      } else {
        setRecipientInputMethodSelectAccount();
      }

      onToChange(address);
      captureMetrics();
    },
    [
      captureMetrics,
      onToChange,
      recipients,
      setRecipientInputMethodSelectContact,
      setRecipientInputMethodSelectAccount,
    ],
  );

  useEffect(() => {
    updateToResolved(recipientResolvedLookup);
  }, [recipientResolvedLookup, updateToResolved]);

  const hasRecipients = recipients.length > 0;

  const renderEndAccessory = useCallback(() => {
    if (to) {
      return (
        <ButtonIcon
          ariaLabel="Clear recipient"
          data-testid="clear-recipient-btn"
          iconName={IconName.Close}
          onClick={clearRecipient}
          size={ButtonIconSize.Sm}
        />
      );
    }
    if (hasRecipients) {
      return (
        <ButtonIcon
          ariaLabel="Open recipient modal"
          data-testid="open-recipient-modal-btn"
          iconName={IconName.Book}
          onClick={openRecipientModal}
          size={ButtonIconSize.Md}
        />
      );
    }
    return null;
  }, [to, hasRecipients, clearRecipient, openRecipientModal]);

  const matchingRecipient = recipients.find(
    (recipient) => recipient.address.toLowerCase() === to?.toLowerCase(),
  );

  return (
    <>
      <Text variant={TextVariant.bodyMdMedium} paddingBottom={1}>
        {t('to')}
      </Text>
      <TextField
        error={Boolean(recipientError)}
        startAccessory={
          matchingRecipient ? (
            <Box alignItems={AlignItems.center} display={Display.Flex}>
              <PreferredAvatar
                address={matchingRecipient.address}
                size={AvatarAccountSize.Sm}
              />
            </Box>
          ) : null
        }
        endAccessory={renderEndAccessory()}
        onChange={(e) => onToChange(e.target.value)}
        onBlur={captureMetrics}
        placeholder={t('recipientPlaceholder')}
        ref={recipientInputRef}
        value={localValue}
        width={BlockSize.Full}
        size={TextFieldSize.Lg}
      />
      {to === toAddressValidated && recipientError && (
        <HelpText severity={HelpTextSeverity.Danger} marginTop={1}>
          {recipientError}
        </HelpText>
      )}
      {to === toAddressValidated && recipientWarning && (
        <HelpText severity={HelpTextSeverity.Warning} marginTop={1}>
          {recipientWarning}
          {hasConfusableCharacters &&
            ` (${recipientConfusableCharacters
              .map(({ point, similarTo }) => t('similarTo', [point, similarTo]))
              .join(', ')})`}
        </HelpText>
      )}
      {to === toAddressValidated && recipientResolvedLookup && (
        <HelpText severity={HelpTextSeverity.Info} marginTop={1}>
          {t('resolvedLookup', [recipientResolvedLookup])}
        </HelpText>
      )}
      <Modal
        isClosedOnEscapeKey={true}
        isClosedOnOutsideClick={true}
        isOpen={isRecipientModalOpen}
        onClose={closeRecipientModal}
      >
        <ModalOverlay />
        <ModalContent size={ModalContentSize.Md}>
          <ModalHeader
            endAccessory={
              <ButtonIcon
                ariaLabel="Close recipient modal"
                data-testid="close-recipient-modal-btn"
                iconName={IconName.Close}
                onClick={closeRecipientModal}
                size={ButtonIconSize.Sm}
              />
            }
          >
            {t('selectRecipient')}
          </ModalHeader>
          <ModalBody>
            <RecipientList
              hideModal={closeRecipientModal}
              onToChange={onRecipientSelectedFromModal}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
