import React, { useCallback } from 'react';
import Modal, { ModalContent } from '../../modal';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type ConfirmResetAccountProps = {
  hideModal: () => void;
  resetAccount: () => Promise<void>;
};

export default function ConfirmResetAccount({
  hideModal,
  resetAccount,
}: ConfirmResetAccountProps) {
  const t = useI18nContext();

  const handleReset = useCallback(() => {
    resetAccount().then(() => hideModal());
  }, [hideModal, resetAccount]);

  return (
    <Modal
      onSubmit={handleReset}
      onCancel={hideModal}
      submitText={t('clear')}
      cancelText={t('nevermind')}
      submitType="danger-primary"
    >
      {/* @ts-expect-error Modal children type uses legacy PropTypes ReactNodeLike */}
      <ModalContent
        title={`${t('clearActivity')}?`}
        description={t('clearActivityDescription')}
      />
    </Modal>
  );
}
