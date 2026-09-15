import React, { useCallback, useState } from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonIconVariant,
  IconAlert,
  IconAlertSeverity,
  IconName,
  IconSize,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type RampsTokenUnavailableInfoProps = {
  testId?: string;
};

/**
 * Info button shown next to a top token that cannot be bought because the
 * user's region (or the providers available in it) does not support it.
 * Opens a modal explaining why (Figma "Token unavailable" dialog, node
 * 77:2444, TRAM-3710/TRAM-3961).
 *
 * @param props - Component props.
 * @param props.testId - Optional test id override for the trigger button.
 */
export function RampsTokenUnavailableInfo({
  testId = 'ramps-token-unavailable-info-button',
}: RampsTokenUnavailableInfoProps = {}) {
  const t = useI18nContext();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <ButtonIcon
        iconName={IconName.Info}
        size={ButtonIconSize.Sm}
        variant={ButtonIconVariant.Default}
        ariaLabel={t('rampsTokenUnavailableTitle')}
        data-testid={testId}
        onClick={handleOpen}
      />
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        data-testid="ramps-token-unavailable-modal"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            onClose={handleClose}
            closeButtonProps={{ ariaLabel: t('close') }}
          >
            <Box className="flex flex-col items-center gap-2">
              <IconAlert severity={IconAlertSeverity.Info} size={IconSize.Xl} />
              <Text
                variant={TextVariant.HeadingSm}
                textAlign={TextAlign.Center}
              >
                {t('rampsTokenUnavailableTitle')}
              </Text>
            </Box>
          </ModalHeader>
          <ModalBody>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              textAlign={TextAlign.Center}
            >
              {t('rampsTokenUnavailableDescription')}
            </Text>
          </ModalBody>
          <ModalFooter
            primaryButtonProps={{
              children: t('gotIt'),
              onClick: handleClose,
            }}
          />
        </ModalContent>
      </Modal>
    </>
  );
}

export default RampsTokenUnavailableInfo;
