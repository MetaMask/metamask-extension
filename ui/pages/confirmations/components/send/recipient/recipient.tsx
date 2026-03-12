import React, { useCallback, useRef, useState, useEffect } from 'react';

import {
  Box,
  Text,
  Icon,
  IconName,
  IconSize,
  IconColor,
  ButtonIcon,
  ButtonIconSize,
  TextColor,
  TextVariant,
  BoxAlignItems,
  FontWeight,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalContentSize,
  HelpText,
  HelpTextSeverity,
} from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useRecipientSelectionMetrics } from '../../../hooks/send/metrics/useRecipientSelectionMetrics';
import { useRecipientValidation } from '../../../hooks/send/useRecipientValidation';
import { useSendContext } from '../../../context/send';
import { useRecipients } from '../../../hooks/send/useRecipients';
import { RecipientList } from '../recipient-list';
import { RecipientInput } from '../recipient-input';

export const Recipient = ({
  recipientValidationResult,
  onAlertIconClick,
}: {
  recipientValidationResult: ReturnType<typeof useRecipientValidation>;
  onAlertIconClick?: () => void;
}) => {
  const {
    recipientError,
    recipientErrorAllowAcknowledge,
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
      <Box alignItems={BoxAlignItems.Center} gap={1} className="pb-1">
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {t('to')}
        </Text>
        {to === toAddressValidated && recipientErrorAllowAcknowledge && (
          <Icon
            name={IconName.Danger}
            size={IconSize.Sm}
            color={IconColor.WarningDefault}
            onClick={onAlertIconClick}
            style={{ cursor: 'pointer' }}
            data-testid="recipient-alert-icon"
          />
        )}
      </Box>
      <RecipientInput
        openRecipientModal={openRecipientModal}
        recipientInputRef={recipientInputRef}
        recipientValidationResult={recipientValidationResult}
      />
      {to === toAddressValidated &&
        recipientError &&
        !recipientErrorAllowAcknowledge && (
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
          color={TextColor.TextAlternative}
          className="mt-1"
          variant={TextVariant.BodyXs}
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
