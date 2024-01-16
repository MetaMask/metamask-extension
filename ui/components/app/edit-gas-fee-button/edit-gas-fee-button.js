import React from 'react';
import PropTypes from 'prop-types';

import { EditGasModes, PriorityLevels } from '../../../../shared/constants/gas';
import {
  Color,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { PRIORITY_LEVEL_ICON_MAP } from '../../../helpers/constants/gas';
///: END:ONLY_INCLUDE_IF
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionEventFragment } from '../../../hooks/useTransactionEventFragment';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import InfoTooltip from '../../ui/info-tooltip/info-tooltip';
import { Icon, IconName, IconSize, Text } from '../../component-library';

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
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  let icon = estimateUsed;
  ///: END:ONLY_INCLUDE_IF
  let title = estimateUsed;
  if (
    estimateUsed === PriorityLevels.high &&
    editGasMode === EditGasModes.swaps
  ) {
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    icon = 'swapSuggested';
    ///: END:ONLY_INCLUDE_IF
    title = 'swapSuggested';
  } else if (estimateUsed === PriorityLevels.tenPercentIncreased) {
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    icon = undefined;
    ///: END:ONLY_INCLUDE_IF
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
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
          icon && (
            <span className="edit-gas-fee-button__icon">
              {PRIORITY_LEVEL_ICON_MAP[icon]}
            </span>
          )
          ///: END:ONLY_INCLUDE_IF
        }
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
                <b>{t('maxBaseFee')}</b> {maxFeePerGas}
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
