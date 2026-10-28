import React, { useCallback, useRef, useState } from 'react';
import { Box, Checkbox } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ButtonPrimary,
  ButtonPrimarySize,
  ModalBody,
  Text,
  ButtonSecondary,
  ButtonSecondarySize,
} from '../../../component-library';
import {
  TextVariant,
  BlockSize,
} from '../../../../helpers/constants/design-system';
import { useDispatch } from '../../../../store/hooks';
import {
  getCustomerServiceToken,
  setShouldShowSupportConsent,
  setSupportDataSharingPreference,
} from '../../../../store/actions';
import { useSupportLinks } from './use-support-consent';

type VisitSupportDataConsentModalProps = {
  onClose: () => void;
  isOpen: boolean;
};

const VisitSupportDataConsentModal = ({
  isOpen,
  onClose,
}: VisitSupportDataConsentModalProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { openSupportLink, openSupportLinkWithoutUserData } = useSupportLinks();
  const [isLoading, setIsLoading] = useState(false);
  const [savePreference, setSavePreference] = useState(true);
  const wasCancelledRef = useRef(false);

  const persistPreference = useCallback(
    (shareData: boolean) => {
      if (!savePreference) {
        return;
      }
      // Saving is best effort: support must still open if the background is
      // unreachable (e.g. from the error page).
      Promise.all([
        dispatch(setSupportDataSharingPreference(shareData)),
        dispatch(setShouldShowSupportConsent(false)),
      ]).catch(() => undefined);
    },
    [dispatch, savePreference],
  );

  // The modal may stay mounted between opens (e.g. in the app header), so the
  // checkbox is reset on every close to be selected by default on the next
  // open, matching mobile where the sheet is remounted each time.
  const closeModal = useCallback(() => {
    setSavePreference(true);
    onClose();
  }, [onClose]);

  const handleModalClose = useCallback(() => {
    // Escape / outside-click during Accept must cancel sharing, matching Reject.
    if (isLoading) {
      wasCancelledRef.current = true;
    }
    closeModal();
  }, [isLoading, closeModal]);

  const handleClickContactSupportButton = useCallback(async () => {
    if (isLoading) {
      return;
    }

    wasCancelledRef.current = false;
    setIsLoading(true);
    try {
      const customerServiceToken = await getCustomerServiceToken();
      if (wasCancelledRef.current) {
        return;
      }
      persistPreference(true);
      closeModal();
      openSupportLink(customerServiceToken);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, closeModal, openSupportLink, persistPreference]);

  const handleClickNoShare = useCallback(() => {
    if (isLoading) {
      return;
    }

    persistPreference(false);
    closeModal();
    openSupportLinkWithoutUserData();
  }, [
    isLoading,
    closeModal,
    openSupportLinkWithoutUserData,
    persistPreference,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      data-testid="visit-support-data-consent-modal"
      className="visit-support-data-consent-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('visitSupportDataConsentModalTitle')}</ModalHeader>
        <ModalBody
          paddingLeft={4}
          paddingRight={4}
          className="visit-support-data-consent-modal__body"
        >
          <Text variant={TextVariant.bodyMd}>
            {t('visitSupportDataConsentModalDescription')}
          </Text>
          <Checkbox
            id="visit-support-data-consent-modal-save-preference"
            data-testid="visit-support-data-consent-modal-save-preference-checkbox"
            className="mt-4"
            label={t('visitSupportDataConsentModalSavePreference')}
            isSelected={savePreference}
            isDisabled={isLoading}
            onChange={() => setSavePreference((current) => !current)}
          />
        </ModalBody>

        <ModalFooter>
          <Box className="flex" gap={4}>
            <ButtonSecondary
              size={ButtonSecondarySize.Lg}
              width={BlockSize.Half}
              onClick={handleClickNoShare}
              disabled={isLoading}
              data-testid="visit-support-data-consent-modal-reject-button"
            >
              {t('visitSupportDataConsentModalReject')}
            </ButtonSecondary>
            <ButtonPrimary
              size={ButtonPrimarySize.Lg}
              width={BlockSize.Half}
              onClick={handleClickContactSupportButton}
              loading={isLoading}
              disabled={isLoading}
              data-testid="visit-support-data-consent-modal-accept-button"
            >
              {t('visitSupportDataConsentModalAccept')}
            </ButtonPrimary>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default VisitSupportDataConsentModal;
