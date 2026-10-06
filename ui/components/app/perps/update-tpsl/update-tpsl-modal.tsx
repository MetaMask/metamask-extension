import React, { useCallback, useState } from 'react';
import type { Position } from '@metamask/perps-controller';
import { Modal } from '../../../component-library/modal/modal';
import { ModalContent } from '../../../component-library/modal-content/modal-content';
import { ModalHeader } from '../../../component-library/modal-header/modal-header';
import { ModalOverlay } from '../../../component-library/modal-overlay/modal-overlay';
import { ModalContentSize } from '../../../component-library/modal-content/modal-content.types';
import { ModalBody } from '../../../component-library/modal-body/modal-body';
import { ModalFooter } from '../../../component-library/modal-footer/modal-footer';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsEventTracking } from '../../../../hooks/perps/usePerpsEventTracking';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import {
  UpdateTPSLModalContent,
  type UpdateTPSLSubmitState,
} from './update-tpsl-modal-content';

export type UpdateTPSLModalProps = {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  currentPrice: number;
};

/**
 * Modal for updating Take Profit / Stop Loss on a position.
 * Visually matches the Edit Margin modal flow.
 * @param options0
 * @param options0.isOpen
 * @param options0.onClose
 * @param options0.position
 * @param options0.currentPrice
 */
export const UpdateTPSLModal = ({
  isOpen,
  onClose,
  position,
  currentPrice,
}: UpdateTPSLModalProps) => {
  const t = useI18nContext();
  const [submitState, setSubmitState] = useState<UpdateTPSLSubmitState | null>(
    null,
  );

  const hasExistingTpsl = Boolean(
    position.takeProfitPrice || position.stopLossPrice,
  );
  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: isOpen,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]: hasExistingTpsl
        ? PERPS_EVENT_VALUE.SCREEN_TYPE.UPDATE_TP_SL
        : PERPS_EVENT_VALUE.SCREEN_TYPE.CREATE_TP_SL,
      [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
      [PERPS_EVENT_PROPERTY.SOURCE]: PERPS_EVENT_VALUE.SOURCE.ASSET_DETAILS,
    },
    resetKey: position.symbol,
  });

  const handleSubmitStateChange = useCallback(
    (state: UpdateTPSLSubmitState) => {
      setSubmitState(state);
    },
    [],
  );

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setSubmitState(null);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="perps-update-tpsl-modal"
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>{t('perpsAutoClose')}</ModalHeader>
        <ModalBody>
          <UpdateTPSLModalContent
            position={position}
            currentPrice={currentPrice}
            onClose={onClose}
            onSubmitStateChange={handleSubmitStateChange}
          />
        </ModalBody>
        <ModalFooter
          onSubmit={submitState?.onSubmit}
          submitButtonProps={{
            'data-testid': 'perps-update-tpsl-modal-submit',
            children: submitState?.isSaving
              ? t('perpsSubmitting')
              : t('perpsSaveChanges'),
            disabled: submitState?.submitDisabled ?? true,
            title: submitState?.submitButtonTitle,
          }}
        />
      </ModalContent>
    </Modal>
  );
};
