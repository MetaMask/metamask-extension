import React from 'react';
import PropTypes from 'prop-types';
import Modal, { ModalContent } from '../../modal';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const LoadingNetworkError = ({ hideModal }) => {
  const t = useI18nContext();

  return (
    <Modal onSubmit={() => hideModal()} submitText={t('tryAgain')}>
      <ModalContent description={t('somethingWentWrong')} />
    </Modal>
  );
};

LoadingNetworkError.propTypes = {
  hideModal: PropTypes.func,
};

export default LoadingNetworkError;
