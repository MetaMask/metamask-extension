import React from 'react';
import PropTypes from 'prop-types';
import withModalProps from '../../../helpers/higher-order-components/with-modal-props';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Modal from '../../app/modal';
import Box from '../../ui/box/box';
import {
  AlignItems,
  BorderRadius,
  DISPLAY,
  FLEX_DIRECTION,
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Text, Icon, IconName, IconSize } from '../../component-library';

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
    <Modal onSubmit={handleSubmit} submitText={t('ok')}>
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        alignItems={AlignItems.center}
        paddingLeft={4}
        paddingRight={4}
        style={{ flex: 1, overflowY: 'auto' }}
      >
        <Icon name={IconName.Warning} size={IconSize.Xl} />
        <Text
          as="h1"
          variant={TextVariant.displayMd}
          textAlign={TextAlign.Center}
          fontWeight={FontWeight.Bold}
          paddingTop={4}
          paddingBottom={4}
        >
          {operationFailed
            ? `${t('operationFailed')}!`
            : `${t('transactionFailed')}!`}
        </Text>
        <Text
          textAlign={TextAlign.Center}
          variant={TextVariant.bodySm}
          paddingTop={4}
          paddingBottom={4}
          paddingLeft={4}
          paddingRight={4}
          borderRadius={BorderRadius.MD}
          className="transaction-failed__description"
        >
          {errorMessage}
        </Text>
      </Box>
    </Modal>
  );
};

TransactionFailedModal.propTypes = {
  hideModal: PropTypes.func,
  errorMessage: PropTypes.string,
  closeNotification: PropTypes.bool,
  operationFailed: PropTypes.bool,
};

export default withModalProps(TransactionFailedModal);
