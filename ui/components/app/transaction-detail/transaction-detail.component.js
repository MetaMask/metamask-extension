import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import { useShouldAnimateGasEstimations } from '../../../hooks/useShouldAnimateGasEstimations';

import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import LoadingHeartBeat from '../../ui/loading-heartbeat';

export default function TransactionDetail({ rows = [], onEdit }) {
  const t = useContext(I18nContext);
  const shouldAnimate = useShouldAnimateGasEstimations();

  return (
    <div className="transaction-detail">
      {process.env.IN_TEST === 'true' ? null : (
        <LoadingHeartBeat active={shouldAnimate} />
      )}
      {onEdit && (
        <div className="transaction-detail-edit">
          <button onClick={onEdit}>{t('edit')}</button>
        </div>
      )}
      <div className="transaction-detail-rows">{rows}</div>
    </div>
  );
}

TransactionDetail.propTypes = {
  rows: PropTypes.arrayOf(TransactionDetailItem).isRequired,
  onEdit: PropTypes.func,
};
