import React from 'react';
import PropTypes from 'prop-types';

import {
  EDIT_GAS_MODES,
  PRIORITY_LEVELS,
} from '../../../../shared/constants/gas';
import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system';
import { PRIORITY_LEVEL_ICON_MAP } from '../../../helpers/constants/gas';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionEventFragment } from '../../../hooks/useTransactionEventFragment';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import InfoTooltip from '../../ui/info-tooltip/info-tooltip';
import Typography from '../../ui/typography/typography';

export default function EditGasFeeButton({ userAcknowledgedGasMissing }) {
  const t = useI18nContext();
  const {
    editGasMode,
    gasLimit,
    hasSimulationError,
    estimateUsed,
    maxFeePerGas,
    maxPriorityFeePerGas,
    supportsEIP1559V2,
    transaction,
  } = useGasFeeContext();
  const { updateTransactionEventFragment } = useTransactionEventFragment();
  const { openModal } = useTransactionModalContext();
  const editEnabled =
    !hasSimulationError || userAcknowledgedGasMissing === true;

  if (!supportsEIP1559V2 || !estimateUsed || !editEnabled) {
    return null;
  }

  let icon = estimateUsed;
  let title = estimateUsed;
  if (
    estimateUsed === PRIORITY_LEVELS.HIGH &&
    editGasMode === EDIT_GAS_MODES.SWAPS
  ) {
    icon = 'swapSuggested';
    title = 'swapSuggested';
  } else if (estimateUsed === PRIORITY_LEVELS.TEN_PERCENT_INCREASED) {
    icon = undefined;
    title = 'tenPercentIncreased';
  }

  const openEditGasFeeModal = () => {
    updateTransactionEventFragment({
      gas_edit_attempted: 'basic',
    });
    openModal('editGasFee');
  };

  const openAdvancedGasFeeModal = () => {
    updateTransactionEventFragment({
      gas_edit_attempted: 'advanced',
    });
    openModal('advancedGasFee');
  };

  return (
    <div className="edit-gas-fee-button">
      <button onClick={openEditGasFeeModal} data-testid="edit-gas-fee-button">
        {icon && (
          <span className="edit-gas-fee-button__icon">
            {PRIORITY_LEVEL_ICON_MAP[icon]}
          </span>
        )}
        <span className="edit-gas-fee-button__label">{t(title)}</span>
        <i className="fas fa-chevron-right asset-list-item__chevron-right" />
      </button>
      {estimateUsed === 'custom' && (
        <button onClick={openAdvancedGasFeeModal}>{t('edit')}</button>
      )}
      {estimateUsed === 'dappSuggested' && (
        <InfoTooltip
          contentText={
            <div className="edit-gas-fee-button__tooltip">
              {transaction?.origin && (
                <Typography
                  variant={TYPOGRAPHY.H7}
                  color={COLORS.TEXT_ALTERNATIVE}
                >
                  {t('dappSuggestedTooltip', [transaction.origin])}
                </Typography>
              )}
              <Typography variant={TYPOGRAPHY.H7}>
                <b>{t('maxBaseFee')}</b> {maxFeePerGas}
              </Typography>
              <Typography variant={TYPOGRAPHY.H7}>
                <b>{t('maxPriorityFee')}</b> {maxPriorityFeePerGas}
              </Typography>
              <Typography variant={TYPOGRAPHY.H7}>
                <b>{t('gasLimit')}</b> {gasLimit}
              </Typography>
            </div>
          }
          position="top"
        />
      )}
    </div>
  );
}

EditGasFeeButton.propTypes = {
  userAcknowledgedGasMissing: PropTypes.bool,
};
