import React, { memo } from 'react';
import PropTypes from 'prop-types';
import withModalProps from '../../../helpers/higher-order-components/with-modal-props';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  BorderRadius,
  Display,
  FlexDirection,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Icon,
  IconName,
  IconSize,
  Text,
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Button,
  BUTTON_VARIANT,
  BUTTON_SIZES,
} from '../../component-library';

const TransactionFailedModal = ({
  hideModal,
  closeNotification,
  operationFailed,
  errorMessage,
}) => {
  const t = useI18nContext();

  const handleSubmit = () => {
    if (closeNotification) {
      global.platform.closeCurrentWindow();
    }
    hideModal();
  };

  return (
    <Modal isOpen onClose={hideModal}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={hideModal}>
          {operationFailed
            ? `${t('operationFailed')}!`
            : `${t('transactionFailed')}!`}
        </ModalHeader>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          paddingLeft={4}
          paddingRight={4}
          marginBottom={4}
          marginTop={4}
          style={{ flex: 1, overflowY: 'auto' }}
        >
          <Icon name={IconName.Warning} size={IconSize.Xl} />
          <Text
            textAlign={TextAlign.Center}
            variant={TextVariant.bodySm}
            paddingTop={4}
            paddingBottom={4}
            paddingLeft={4}
            paddingRight={4}
            marginTop={4}
            borderRadius={BorderRadius.MD}
            className="transaction-failed__description"
          >
            {errorMessage}
          </Text>
        </Box>
        <Box display={Display.Flex}>
          <Button
            block
            variant={BUTTON_VARIANT.PRIMARY}
            size={BUTTON_SIZES.LG}
            onClick={handleSubmit}
          >
            {t('ok')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

TransactionFailedModal.propTypes = {
  hideModal: PropTypes.func,
  errorMessage: PropTypes.string,
  closeNotification: PropTypes.bool,
  operationFailed: PropTypes.bool,
};

export default withModalProps(memo(TransactionFailedModal));
