import React, { useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { I18nContext } from '../../../contexts/i18n';
import { useShouldAnimateGasEstimations } from '../../../hooks/useShouldAnimateGasEstimations';

import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';

export default function TransactionDetail({ rows = [], onEdit }) {
  const t = useContext(I18nContext);

  const containerNode = useRef(null);
  const loadingAnimationClass = useShouldAnimateGasEstimations(containerNode);

  return (
    <div
      ref={containerNode}
      className={classNames('transaction-detail', loadingAnimationClass)}
    >
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
