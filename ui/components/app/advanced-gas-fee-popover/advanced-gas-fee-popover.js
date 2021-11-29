import React from 'react';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';

import Box from '../../ui/box';
import Button from '../../ui/button';
import I18nValue from '../../ui/i18n-value';
import Popover from '../../ui/popover';

import AdvancedGasFeeInputs from './advanced-gas-fee-inputs';

const AdvancedGasFeePopover = () => {
  const t = useI18nContext();
  const {
    closeModal,
    closeAllModals,
    currentModal,
  } = useTransactionModalContext();

  if (currentModal !== 'advancedGasFee') return null;

  return (
    <Popover
      className="advanced-gas-fee-popover"
      title={t('advancedGasFeeModalTitle')}
      onBack={() => closeModal('advancedGasFee')}
      onClose={closeAllModals}
      footer={
        <Button type="primary">
          <I18nValue messageKey="save" />
        </Button>
      }
    >
      <Box className="advanced-gas-fee-popover__wrapper">
        <AdvancedGasFeeInputs />
      </Box>
    </Popover>
  );
};

export default AdvancedGasFeePopover;
