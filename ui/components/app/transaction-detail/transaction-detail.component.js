import React from 'react';
import PropTypes from 'prop-types';

import { useGasFeeContext } from '../../../contexts/gasFee';
import InfoTooltip from '../../ui/info-tooltip/info-tooltip';
import Typography from '../../ui/typography/typography';

import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import { COLORS } from '../../../helpers/constants/design-system';
import { PRIORITY_LEVEL_ICON_MAP } from '../../../helpers/constants/gas';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function TransactionDetail({ rows = [], onEdit }) {
  // eslint-disable-next-line prefer-destructuring
  const EIP_1559_V2 = process.env.EIP_1559_V2;

  const t = useI18nContext();
  const {
    gasLimit,
    estimateUsed,
    maxFeePerGas,
    maxPriorityFeePerGas,
    transaction,
  } = useGasFeeContext();

  if (EIP_1559_V2 && estimateUsed) {
    return (
      <div className="transaction-detail">
        <div className="transaction-detail-edit-V2">
          <button onClick={onEdit}>
            <span className="transaction-detail-edit-V2__icon">
              {`${PRIORITY_LEVEL_ICON_MAP[estimateUsed]} `}
            </span>
            <span className="transaction-detail-edit-V2__label">
              {t(estimateUsed)}
            </span>
            <i className="fas fa-chevron-right asset-list-item__chevron-right" />
          </button>
          {estimateUsed === 'custom' && onEdit && (
            <button onClick={onEdit}>{t('edit')}</button>
          )}
          {estimateUsed === 'dappSuggested' && (
            <InfoTooltip
              contentText={
                <div className="transaction-detail-edit-V2__tooltip">
                  <Typography fontSize="12px" color={COLORS.GREY}>
                    {t('dappSuggestedTooltip', [transaction.origin])}
                  </Typography>
                  <Typography fontSize="12px">
                    <b>{t('maxBaseFee')}</b>
                    {maxFeePerGas}
                  </Typography>
                  <Typography fontSize="12px">
                    <b>{t('maxPriorityFee')}</b>
                    {maxPriorityFeePerGas}
                  </Typography>
                  <Typography fontSize="12px">
                    <b>{t('gasLimit')}</b>
                    {gasLimit}
                  </Typography>
                </div>
              }
              position="top"
            />
          )}
        </div>
        <div className="transaction-detail-rows">{rows}</div>
      </div>
    );
  }

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
