import React, { memo } from 'react';
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
  ModalOverlay,
  Button,
  ButtonVariant,
  ButtonSize,
  ModalContent,
  ModalHeader,
} from '../../component-library';

type TransactionFailedModalProps = {
  hideModal: () => void;
  closeNotification?: boolean;
  operationFailed?: boolean;
  errorMessage?: string;
};

const TransactionFailedModal: React.FC<TransactionFailedModalProps> = ({
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
        <Box display={Display.Flex} paddingLeft={4} paddingRight={4}>
          <Button
            block
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={handleSubmit}
          >
            {t('ok')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default withModalProps(memo(TransactionFailedModal));
