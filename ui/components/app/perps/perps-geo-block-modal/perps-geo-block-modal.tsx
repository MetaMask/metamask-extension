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

export type PerpsGeoBlockModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Modal shown to geo-blocked users when they attempt a restricted Perps action
 * (trade, deposit, modify, close, TP/SL, etc.). Matches the mobile
 * PerpsBottomSheetTooltip with contentKey="geo_block".
 *
 * @param options0 - Component props
 * @param options0.isOpen - Whether the modal is visible
 * @param options0.onClose - Callback to dismiss the modal
 */
export const PerpsGeoBlockModal = ({
  isOpen,
  onClose,
}: PerpsGeoBlockModalProps) => {
  const t = useI18nContext();

  // The restriction notice is a displayed funnel state, so it reports its own
  // screen view. Emitted here rather than at the ~17 trigger sites so every
  // host reports it once per open; the fire-once guard re-arms when the modal
  // closes, so reopening it tracks again.
  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: isOpen,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
        PERPS_EVENT_VALUE.SCREEN_TYPE.GEO_BLOCK_NOTIF,
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="perps-geo-block-modal"
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>{t('perpsGeoBlockedTitle')}</ModalHeader>
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
              {t('perpsGeoBlockedDescription')}
            </Text>
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={onClose}
              data-testid="perps-geo-block-modal-dismiss"
            >
              {t('gotIt')}
            </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
