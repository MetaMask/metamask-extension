import React from 'react';

import { PRIORITY_LEVELS } from '../../../../shared/constants/gas';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import Popover from '../../ui/popover';
import I18nValue from '../../ui/i18n-value';
import LoadingHeartBeat from '../../ui/loading-heartbeat';

import EditGasItem from './edit-gas-item';

const EditGasFeePopover = () => {
  const t = useI18nContext();
  const { closeModal, currentModal } = useTransactionModalContext();

  if (currentModal !== 'editGasFee') return null;

  return (
    <Popover
      title={t('editGasFeeModalTitle')}
      onClose={() => closeModal('editGasFee')}
      className="edit-gas-fee-popover"
    >
      <>
        {process.env.IN_TEST === 'true' ? null : <LoadingHeartBeat />}
        <div className="edit-gas-fee-popover__wrapper">
          <div className="edit-gas-fee-popover__content">
            <div className="edit-gas-fee-popover__content__header">
              <span className="edit-gas-fee-popover__content__header-option">
                <I18nValue messageKey="gasOption" />
              </span>
              <span className="edit-gas-fee-popover__content__header-time">
                <I18nValue messageKey="time" />
              </span>
              <span className="edit-gas-fee-popover__content__header-max-fee">
                <I18nValue messageKey="maxFee" />
              </span>
            </div>
            <EditGasItem priorityLevel={PRIORITY_LEVELS.LOW} />
            <EditGasItem priorityLevel={PRIORITY_LEVELS.MEDIUM} />
            <EditGasItem priorityLevel={PRIORITY_LEVELS.HIGH} />
            <div className="edit-gas-fee-popover__content__separator" />
            <EditGasItem priorityLevel={PRIORITY_LEVELS.DAPP_SUGGESTED} />
            <EditGasItem priorityLevel={PRIORITY_LEVELS.CUSTOM} />
          </div>
        </div>
      </>
    </Popover>
  );
};

export default EditGasFeePopover;
