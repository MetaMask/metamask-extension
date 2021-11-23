import React from 'react';

import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import { useI18nContext } from '../../../hooks/useI18nContext';

import Popover from '../../ui/popover';
import Box from '../../ui/box';
import Button from '../../ui/button';
import I18nValue from '../../ui/i18n-value';

const AdvancedGasFeePopover = () => {
  const t = useI18nContext();
  const { currentModal, closeModal } = useTransactionModalContext();

  if (currentModal !== 'advancedGasFee') return null;

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
