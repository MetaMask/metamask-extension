import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { rpcErrors, serializeError } from '@metamask/rpc-errors';
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
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import {
  disableAccountUpgradeForChain,
  rejectPendingApproval,
} from '../../../../../../store/actions';
import { useConfirmContext } from '../../../../context/confirm';
import ZENDESK_URLS from '../../../../../../helpers/constants/zendesk-url';

export function UpgradeCancelModal({
  isOpen,
  onClose,
  onReject,
}: {
  isOpen: boolean;
  onClose: () => void;
  onReject: () => void;
}) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext();
  const { id: confirmationId } = currentConfirmation ?? {};
  const chainId = currentConfirmation?.chainId as string;

  const handleRejectUpgrade = useCallback(async () => {
    const error = rpcErrors.methodNotSupported('User rejected account upgrade');
    const serializedError = serializeError(error);

    await disableAccountUpgradeForChain(chainId);

    dispatch(rejectPendingApproval(confirmationId, serializedError));
  }, [dispatch, confirmationId, chainId]);

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
