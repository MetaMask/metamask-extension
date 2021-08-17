import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';

import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';

export default function TransactionDetail({ rows = [], onEdit }) {
  const t = useContext(I18nContext);

  return (
    <div className="transaction-detail">
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
