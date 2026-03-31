import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../../hooks/useI18nContext';

import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';

export default function TransactionDetail({
  rows = [],
  onEdit,
  userAcknowledgedGasMissing: _userAcknowledgedGasMissing = false,
  disableEditGasFeeButton: _disableEditGasFeeButton = false,
}) {
  const t = useI18nContext();

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
  /**
   * Show item content for transaction detail. Array of TransactionDetailItem components
   */
  rows: PropTypes.arrayOf(TransactionDetailItem).isRequired,
  /**
   * onClick handler for the Edit link
   */
  onEdit: PropTypes.func,
  userAcknowledgedGasMissing: PropTypes.bool,
  disableEditGasFeeButton: PropTypes.bool,
};
