import React from 'react';
import PropTypes from 'prop-types';

import { useGasFeeContext } from '../../../contexts/gasFee';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import InfoTooltip from '../../ui/info-tooltip/info-tooltip';
import Typography from '../../ui/typography/typography';

import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system';
import { PRIORITY_LEVEL_ICON_MAP } from '../../../helpers/constants/gas';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function TransactionDetail({
  rows = [],
  onEdit,
  userAcknowledgedGasMissing,
}) {
  const t = useI18nContext();
  const {
    gasLimit,
    hasSimulationError,
    estimateUsed,
    maxFeePerGas,
    maxPriorityFeePerGas,
    supportsEIP1559V2,
    transaction,
  } = useGasFeeContext();
  const { openModal } = useTransactionModalContext();

  if (supportsEIP1559V2 && estimateUsed) {
    const editEnabled = !hasSimulationError || userAcknowledgedGasMissing;
    if (!editEnabled) return null;

    return (
      <div className="transaction-detail">
        <div className="transaction-detail-edit-V2">
          <button onClick={() => openModal('editGasFee')}>
            <span
              className={`transaction-detail-edit-V2__icon transaction-detail-edit-V2__icon-${estimateUsed}`}
            >
              {`${PRIORITY_LEVEL_ICON_MAP[estimateUsed]} `}
            </span>
            <span className="transaction-detail-edit-V2__label">
              {t(estimateUsed)}
            </span>
            <i className="fas fa-chevron-right asset-list-item__chevron-right" />
          </button>
          {estimateUsed === 'custom' && (
            <button
              onClick={() => openModal('advancedGasFee')}
              className="transaction-detail__edit-button"
            >
              {t('edit')}
            </button>
          )}
          {estimateUsed === 'dappSuggested' && (
            <InfoTooltip
              contentText={
                <div className="transaction-detail-edit-V2__tooltip">
                  <Typography
                    tag={TYPOGRAPHY.Paragraph}
                    variant={TYPOGRAPHY.H7}
                    color={COLORS.GREY}
                  >
                    {t('dappSuggestedTooltip', [transaction.origin])}
                  </Typography>
                  <Typography
                    tag={TYPOGRAPHY.Paragraph}
                    variant={TYPOGRAPHY.H7}
                  >
                    <strong>{t('maxBaseFee')}</strong>
                    {maxFeePerGas}
                  </Typography>
                  <Typography
                    tag={TYPOGRAPHY.Paragraph}
                    variant={TYPOGRAPHY.H7}
                  >
                    <strong>{t('maxPriorityFee')}</strong>
                    {maxPriorityFeePerGas}
                  </Typography>
                  <Typography
                    tag={TYPOGRAPHY.Paragraph}
                    variant={TYPOGRAPHY.H7}
                  >
                    <strong>{t('gasLimit')}</strong>
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
  userAcknowledgedGasMissing: PropTypes.bool.isRequired,
};
