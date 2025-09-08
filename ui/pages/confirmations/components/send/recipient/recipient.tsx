import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

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
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
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
import { getUseBlockie } from '../../../../../selectors';
import { RecipientList } from '../recipient-list';

export const Recipient = () => {
  const {
    recipientConfusableCharacters,
    recipientError,
    recipientWarning,
    recipientResolvedLookup,
  } = useRecipientValidation();
  const t = useI18nContext();
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const { to, updateTo, updateToResolvedLookup } = useSendContext();
  const { captureRecipientSelected } = useRecipientSelectionMetrics();
  const recipients = useRecipients();
  const useBlockie = useSelector(getUseBlockie);
  const recipientInputRef = useRef<HTMLInputElement>(null);
  const closeRecipientModal = useCallback(() => {
    setIsRecipientModalOpen(false);
  }, []);

  const openRecipientModal = useCallback(() => {
    recipientInputRef.current?.blur();
    setIsRecipientModalOpen(true);
  }, []);

  const onChange = useCallback(
    (e) => {
      const toAddress = e.target.value;
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

  useEffect(() => {
    updateToResolvedLookup(recipientResolvedLookup);
  }, [recipientResolvedLookup, updateToResolvedLookup]);

  // Find matching recipient for the current 'to' address
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
              <AvatarAccount
                address={matchingRecipient.address}
                size={AvatarAccountSize.Sm}
                variant={
                  useBlockie
                    ? AvatarAccountVariant.Blockies
                    : AvatarAccountVariant.Jazzicon
                }
              />
            </Box>
          ) : null
        }
        endAccessory={
          <ButtonIcon
            ariaLabel="Open recipient modal"
            data-testid="open-recipient-modal-btn"
            iconName={IconName.Book}
            onClick={openRecipientModal}
            size={ButtonIconSize.Sm}
          />
        }
        onChange={onChange}
        onBlur={captureMetrics}
        ref={recipientInputRef}
        value={to}
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
          {recipientConfusableCharacters.length > 0 &&
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
            <RecipientList hideModal={closeRecipientModal} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
