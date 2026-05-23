import React, { useRef, useCallback, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Text,
  TextVariant,
  TextAlign,
  Icon,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
  ModalBody,
  ModalFooter,
} from '../../../component-library';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { usePerpsEventTracking } from '../../../../hooks/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import type { Position, AccountState } from '../types';
import { EditMarginModalContent } from './edit-margin-modal-content';

export type EditMarginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  account: AccountState | null;
  currentPrice: number;
  /** 'add' | 'remove' — modal title and content mode */
  mode: 'add' | 'remove';
};

/**
 * Modal for adding or decreasing margin on a position.
 * Title and content are single-purpose based on mode.
 * @param options0
 * @param options0.isOpen
 * @param options0.onClose
 * @param options0.position
 * @param options0.account
 * @param options0.currentPrice
 * @param options0.mode
 */
export const EditMarginModal: React.FC<EditMarginModalProps> = ({
  isOpen,
  onClose,
  position,
  account,
  currentPrice,
  mode,
}) => {
  const t = useI18nContext();
  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: isOpen,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
        mode === 'add'
          ? PERPS_EVENT_VALUE.SCREEN_TYPE.ADD_MARGIN
          : PERPS_EVENT_VALUE.SCREEN_TYPE.REMOVE_MARGIN,
      [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
      [PERPS_EVENT_PROPERTY.SOURCE]: PERPS_EVENT_VALUE.SOURCE.ASSET_DETAILS,
    },
  });
  const title = mode === 'add' ? t('perpsAddMargin') : t('perpsRemoveMargin');
  const saveRef = useRef<(() => void) | null>(null);
  const [saveEnabled, setSaveEnabled] = useState(false);

  const handleSave = useCallback(() => {
    saveRef.current?.();
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid={
        mode === 'add'
          ? 'perps-add-margin-modal'
          : 'perps-decrease-margin-modal'
      }
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            gap={2}
          >
            <Icon
              name={mode === 'add' ? IconName.AddCircle : IconName.RemoveMinus}
              size={IconSize.Xl}
            />
            <Text variant={TextVariant.HeadingSm} textAlign={TextAlign.Center}>
              {title}
            </Text>
          </Box>
        </ModalHeader>
        <ModalBody>
          <EditMarginModalContent
            position={position}
            account={account}
            currentPrice={currentPrice}
            mode={mode}
            onClose={onClose}
            externalSave
            onSaveRef={saveRef}
            onSaveEnabledChange={setSaveEnabled}
          />
        </ModalBody>
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSave}
          cancelButtonProps={{
            'data-testid': 'perps-edit-margin-modal-cancel',
            children: t('cancel'),
          }}
          submitButtonProps={{
            'data-testid': 'perps-edit-margin-modal-save',
            children: t('save'),
            disabled: !saveEnabled,
          }}
        />
      </ModalContent>
    </Modal>
  );
};
