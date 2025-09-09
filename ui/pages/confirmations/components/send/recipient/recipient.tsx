import React, { useCallback, useRef, useState } from 'react';

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
} from '../../../../../components/component-library';
import {
  BlockSize,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useRecipientSelectionMetrics } from '../../../hooks/send/metrics/useRecipientSelectionMetrics';
import { useSendContext } from '../../../context/send';
import { RecipientList } from '../recipient-list';

export const Recipient = ({ setTo }: { setTo: (to?: string) => void }) => {
  const t = useI18nContext();
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const { to, updateTo } = useSendContext();
  const { captureRecipientSelected } = useRecipientSelectionMetrics();
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
      setTo(toAddress);
      updateTo(toAddress);
    },
    [setTo, updateTo],
  );

  const captureMetrics = useCallback(() => {
    if (!to) {
      return;
    }
    captureRecipientSelected();
  }, [captureRecipientSelected, to]);

  return (
    <>
      <Text variant={TextVariant.bodyMdMedium} paddingBottom={1}>
        {t('to')}
      </Text>
      <TextField
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
