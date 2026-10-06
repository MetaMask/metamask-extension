import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Text } from '../../../component-library/text/text';
import { Box } from '../../../component-library/box/box';
import { Button } from '../../../component-library/button/button';
import { Modal } from '../../../component-library/modal/modal';
import { ModalOverlay } from '../../../component-library/modal-overlay/modal-overlay';
import {
  BUTTON_VARIANT,
  BUTTON_SIZES,
} from '../../../component-library/button';
import { ModalContent } from '../../../component-library/modal-content/deprecated/modal-content';
import { ModalHeader } from '../../../component-library/modal-header/deprecated/modal-header';

import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';

export default function SnapRemoveWarning({
  isOpen,
  onCancel,
  onSubmit,
  snapName,
}) {
  const t = useI18nContext();
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          gap: 4,
        }}
      >
        <ModalHeader onClose={onCancel}>{t('pleaseConfirm')}</ModalHeader>
        <Text>{t('removeSnapConfirmation', [snapName])}</Text>
        <Box width={BlockSize.Full} display={Display.Flex} gap={4}>
          <Button
            block
            variant={BUTTON_VARIANT.SECONDARY}
            size={BUTTON_SIZES.LG}
            onClick={onCancel}
          >
            {t('cancel')}
          </Button>
          <Button
            block
            size={BUTTON_SIZES.LG}
            id="popoverRemoveSnapButton"
            danger
            onClick={onSubmit}
          >
            {t('removeSnap')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}

SnapRemoveWarning.propTypes = {
  /**
   * onCancel handler
   */
  onCancel: PropTypes.func,
  /**
   * onSubmit handler
   */
  onSubmit: PropTypes.func,
  /**
   * Name of snap
   */
  snapName: PropTypes.string,
  /**
   * Whether the modal is open
   */
  isOpen: PropTypes.bool,
};
