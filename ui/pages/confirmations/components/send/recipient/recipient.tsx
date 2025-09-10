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
import { useRecipientValidation } from '../../../hooks/send/validations/useRecipientValidation';
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
  } = useRecipientValidation();
  const hasConfusableCharacters =
    recipientConfusableCharacters && recipientConfusableCharacters.length > 0;
  const t = useI18nContext();
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const { to, updateTo } = useSendContext();
  const [localValue, setLocalValue] = useState(to || '');
  const { captureRecipientSelected } = useRecipientSelectionMetrics();
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
    (address: string) => {
      const toAddress = address;
      setLocalValue(toAddress);
      updateTo(toAddress);
    },
    [updateTo],
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

  useEffect(() => {
    if (recipientResolvedLookup) {
      updateTo(recipientResolvedLookup);
    }
  }, [recipientResolvedLookup, updateTo]);

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
            <Box
              alignItems={AlignItems.center}
              display={Display.Flex}
              paddingLeft={2}
            >
              <PreferredAvatar
                address={matchingRecipient.address}
                size={AvatarAccountSize.Sm}
              />
            </Box>
          ) : null
        }
        endAccessory={
          <ButtonIcon
            ariaLabel={to ? 'Clear recipient' : 'Open recipient modal'}
            data-testid={
              to ? 'clear-recipient-btn' : 'open-recipient-modal-btn'
            }
            iconName={to ? IconName.Close : IconName.Book}
            onClick={to ? clearRecipient : openRecipientModal}
            size={ButtonIconSize.Sm}
          />
        }
        onChange={(e) => onToChange(e.target.value)}
        onBlur={captureMetrics}
        ref={recipientInputRef}
        value={localValue}
        width={BlockSize.Full}
        size={TextFieldSize.Lg}
      />
      {recipientError && (
        <HelpText severity={HelpTextSeverity.Danger} marginTop={1}>
          {recipientError}
        </HelpText>
      )}
      {recipientWarning && (
        <HelpText severity={HelpTextSeverity.Warning} marginTop={1}>
          {recipientWarning}
          {hasConfusableCharacters &&
            ` (${recipientConfusableCharacters
              .map(({ point, similarTo }) => t('similarTo', [point, similarTo]))
              .join(', ')})`}
        </HelpText>
      )}
      {recipientResolvedLookup && (
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
              onToChange={onToChange}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
