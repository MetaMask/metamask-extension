import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
  ModalBody,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
// Imported from the module, not the `hooks/perps` barrel: hosts that render
// this modal partially mock that barrel, which would leave the hook undefined.
import { usePerpsEventTracking } from '../../../../hooks/perps/usePerpsEventTracking';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';

export type PerpsWithdrawMultiSigModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Modal shown when a HyperLiquid multi-sig account attempts to withdraw.
 * MetaMask cannot produce HyperLiquid multi-sig signatures, so the withdrawal
 * would always be rejected (`Multi-sig required`); the user is pointed to the
 * Hyperliquid app instead.
 *
 * @param options0 - Component props
 * @param options0.isOpen - Whether the modal is visible
 * @param options0.onClose - Callback to dismiss the modal
 */
export const PerpsWithdrawMultiSigModal = ({
  isOpen,
  onClose,
}: PerpsWithdrawMultiSigModalProps) => {
  const t = useI18nContext();

  // The restriction notice is a displayed funnel state, so it reports its own
  // screen view; the fire-once guard re-arms when the modal closes, so
  // reopening it tracks again.
  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: isOpen,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
        PERPS_EVENT_VALUE.SCREEN_TYPE.MULTI_SIG_BLOCK_NOTIF,
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="perps-withdraw-multi-sig-modal"
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>
          {t('perpsWithdrawMultiSigTitle')}
        </ModalHeader>
        <ModalBody>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            gap={4}
          >
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('perpsWithdrawMultiSigDescription')}
            </Text>
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={onClose}
              data-testid="perps-withdraw-multi-sig-modal-dismiss"
            >
              {t('gotIt')}
            </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
