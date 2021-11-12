import React from 'react';
import PropTypes from 'prop-types';

import { GAS_ESTIMATE } from '../../../../shared/constants/gas';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Popover from '../../ui/popover';
import I18nValue from '../../ui/i18n-value';
import LoadingHeartBeat from '../../ui/loading-heartbeat';

import EditGasItem from './edit-gas-item';

const EditGasFeePopover = ({ onClose }) => {
  const t = useI18nContext();

  return (
    <Popover
      title={t('editGasFeeModalTitle')}
      onClose={onClose}
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
            <EditGasItem estimateType={GAS_ESTIMATE.LOW} onClose={onClose} />
            <EditGasItem estimateType={GAS_ESTIMATE.MEDIUM} onClose={onClose} />
            <EditGasItem estimateType={GAS_ESTIMATE.HIGH} onClose={onClose} />
            <div className="edit-gas-fee-popover__content__separator" />
            <EditGasItem
              estimateType={GAS_ESTIMATE.DAPP_SUGGESTED}
              onClose={onClose}
            />
            <EditGasItem estimateType={GAS_ESTIMATE.CUSTOM} onClose={onClose} />
          </div>
        </div>
      </>
    </Popover>
  );
};

EditGasFeePopover.propTypes = {
  onClose: PropTypes.func,
};

export default EditGasFeePopover;
