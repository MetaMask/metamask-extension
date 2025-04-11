// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

import {
  Box,
  Button,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../../../../../helpers/constants/design-system';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import ZENDESK_URLS from '../../../../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../context/confirm';
import { useSmartAccountActions } from '../../../../hooks/useSmartAccountActions';

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function UpgradeCancelModal({
  isOpen,
  onClose,
  onReject,
}: {
  isOpen: boolean;
  onClose: () => void;
  onReject: () => void;
}) {
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const { handleRejectUpgrade } = useSmartAccountActions();

  if (!currentConfirmation) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Md}>
        <ModalHeader onClose={onClose}>
          {t('confirmUpgradeCancelModalTitle')}
        </ModalHeader>
        <ModalBody>
          <Text style={{ whiteSpace: 'pre-wrap' }}>
            {t('confirmUpgradeCancelModalDescription', [
              <a
                key="learnMoreLink"
                target="_blank"
                rel="noopener noreferrer"
                href={ZENDESK_URLS.ACCOUNT_UPGRADE}
              >
                {t('learnMoreUpperCase')}
              </a>,
            ])}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.stretch}
            gap={4}
          >
            <Button
              // eslint-disable-next-line @typescript-eslint/no-misused-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31879
              onClick={handleRejectUpgrade}
              variant={ButtonVariant.Secondary}
              data-testid="upgrade-cancel-reject-upgrade"
            >
              {t('confirmUpgradeCancelModalButtonCancelUpgrade')}
            </Button>
            <Button onClick={onReject} data-testid="upgrade-cancel-reject">
              {t('confirmUpgradeCancelModalButtonCancelTransaction')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
