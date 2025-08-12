import React from 'react';
import PropTypes from 'prop-types';

import {
  EditGasModes,
  PriorityLevels,
} from '../../../../../shared/constants/gas';
import {
  Color,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { PRIORITY_LEVEL_ICON_MAP } from '../../../../helpers/constants/gas';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionEventFragment } from '../../hooks/useTransactionEventFragment';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';
import InfoTooltip from '../../../../components/ui/info-tooltip/info-tooltip';
import {
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';

export default function EditGasFeeButton({ userAcknowledgedGasMissing }) {
  const t = useI18nContext();
  const {
    editGasMode,
    gasLimit,
    hasSimulationError,
    estimateUsed,
    maxFeePerGas,
    maxPriorityFeePerGas,
    supportsEIP1559,
    transaction,
  } = useGasFeeContext();
  const { updateTransactionEventFragment } = useTransactionEventFragment();
  const { openModal } = useTransactionModalContext();
  const editEnabled =
    !hasSimulationError || userAcknowledgedGasMissing === true;

  if (!supportsEIP1559 || !estimateUsed || !editEnabled) {
    return null;
  }
  let icon = estimateUsed;
  let title = estimateUsed;
  if (
    estimateUsed === PriorityLevels.high &&
    editGasMode === EditGasModes.swaps
  ) {
    icon = 'swapSuggested';
    title = 'swapSuggested';
  } else if (estimateUsed === PriorityLevels.tenPercentIncreased) {
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
        <Icon
          name={IconName.ArrowRight}
          color={Color.primaryDefault}
          size={IconSize.Xs}
        />
      </button>
      {estimateUsed === 'custom' && (
        <button onClick={openAdvancedGasFeeModal}>{t('edit')}</button>
      )}
      {estimateUsed === 'dappSuggested' && (
        <InfoTooltip
          contentText={
            <div className="edit-gas-fee-button__tooltip">
              {transaction?.origin && (
                <Text
                  variant={TextVariant.bodySm}
                  as="h6"
                  color={TextColor.textAlternative}
                >
                  {t('dappSuggestedTooltip', [transaction.origin])}
                </Text>
              )}
              <Text variant={TextVariant.bodySm} as="h6">
                <b>{t('maxFee')}</b> {maxFeePerGas}
              </Text>
              <Text variant={TextVariant.bodySm} as="h6">
                <b>{t('maxPriorityFee')}</b> {maxPriorityFeePerGas}
              </Text>
              <Text variant={TextVariant.bodySm} as="h6">
                <b>{t('gasLimit')}</b> {gasLimit}
              </Text>
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
