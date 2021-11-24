import React from 'react';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';

import Box from '../../ui/box';
import Button from '../../ui/button';
import I18nValue from '../../ui/i18n-value';
import Popover from '../../ui/popover';

const AdvancedGasFeePopover = () => {
  const t = useI18nContext();
  const { closeModal, currentModal } = useTransactionModalContext();

  if (currentModal !== 'advancedGasFee') return null;

  // todo: align styles to edit gas fee modal
  return (
    <Popover
      className="advanced-gas-fee-popover"
      title={t('advancedGasFeeModalTitle')}
      onBack={() => closeModal('advancedGasFee')}
      onClose={() => closeModal('advancedGasFee')}
      footer={
        <Button type="primary">
          <I18nValue messageKey="save" />
        </Button>
      }
    >
      <Box className="advanced-gas-fee-popover" margin={4}></Box>
    </Popover>
  );
};

export default AdvancedGasFeePopover;
