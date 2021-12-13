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
  }

  return (
    <div className="edit-gas-fee-button">
      <button onClick={() => openModal('editGasFee')}>
        <span className="edit-gas-fee-button__icon">
          {`${PRIORITY_LEVEL_ICON_MAP[icon]} `}
        </span>
        <span className="edit-gas-fee-button__label">{t(title)}</span>
        <i className="fas fa-chevron-right asset-list-item__chevron-right" />
      </button>
      {estimateUsed === 'custom' && (
        <button onClick={() => openModal('advancedGasFee')}>{t('edit')}</button>
      )}
      {estimateUsed === 'dappSuggested' && (
        <InfoTooltip
          contentText={
            <div className="edit-gas-fee-button__tooltip">
              <Typography variant={TYPOGRAPHY.H7} color={COLORS.GREY}>
                {t('dappSuggestedTooltip', [transaction.origin])}
              </Typography>
              <Typography variant={TYPOGRAPHY.H7}>
                <b>{t('maxBaseFee')}</b>
                {maxFeePerGas}
              </Typography>
              <Typography variant={TYPOGRAPHY.H7}>
                <b>{t('maxPriorityFee')}</b>
                {maxPriorityFeePerGas}
              </Typography>
              <Typography variant={TYPOGRAPHY.H7}>
                <b>{t('gasLimit')}</b>
                {gasLimit}
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
