import React, { useCallback, useRef, useState, useEffect } from 'react';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalContentSize,
  Text,
  IconName,
  ButtonIcon,
  ButtonIconSize,
  HelpText,
  HelpTextSeverity,
} from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useRecipientSelectionMetrics } from '../../../hooks/send/metrics/useRecipientSelectionMetrics';
import { useRecipientValidation } from '../../../hooks/send/useRecipientValidation';
import { useSendContext } from '../../../context/send';
import { useRecipients } from '../../../hooks/send/useRecipients';
import { RecipientList } from '../recipient-list';
import { RecipientInput } from '../recipient-input';

export const Recipient = ({
  recipientValidationResult,
}: {
  recipientValidationResult: ReturnType<typeof useRecipientValidation>;
}) => {
  const {
    recipientError,
    recipientWarning,
    recipientResolvedLookup,
    toAddressValidated,
    resolutionProtocol,
  } = recipientValidationResult;
  const t = useI18nContext();
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const { to, updateTo, updateToResolved } = useSendContext();
  const {
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

  const onRecipientSelectedFromModal = useCallback(
    (address: string) => {
      const isRecipientContact = recipients.some(
        (recipient) =>
          recipient.address.toLowerCase() === address.toLowerCase() &&
          recipient.isContact,
      );
      if (isRecipientContact) {
        setRecipientInputMethodSelectContact();
      } else {
        setRecipientInputMethodSelectAccount();
      }

      updateTo(address);
    },
    [
      recipients,
      updateTo,
      setRecipientInputMethodSelectContact,
      setRecipientInputMethodSelectAccount,
    ],
  );

  useEffect(() => {
    updateToResolved(recipientResolvedLookup);
  }, [recipientResolvedLookup, updateToResolved]);

  return (
    <>
      <Text variant={TextVariant.bodyMdMedium} paddingBottom={1}>
        {t('to')}
      </Text>
      <RecipientInput
        openRecipientModal={openRecipientModal}
        recipientInputRef={recipientInputRef}
        recipientValidationResult={recipientValidationResult}
      />
      {to === toAddressValidated && recipientError && (
        <HelpText severity={HelpTextSeverity.Danger} marginTop={1}>
          {recipientError}
        </HelpText>
      )}
      {to === toAddressValidated && recipientWarning && (
        <HelpText severity={HelpTextSeverity.Warning} marginTop={1}>
          {recipientWarning}
        </HelpText>
      )}
      {to === toAddressValidated && recipientResolvedLookup && (
        <Text
          color={TextColor.textAlternative}
          marginTop={1}
          variant={TextVariant.bodyXs}
        >
          {t('resolutionProtocol', [resolutionProtocol ?? ''])}
        </Text>
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
          <ModalBody paddingRight={0} paddingLeft={0}>
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
