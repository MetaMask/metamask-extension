import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  EditGasModes,
  PriorityLevels,
} from '../../../../../shared/constants/gas';
import {
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { isMetamaskSuggestedGasEstimate } from '../../../../helpers/utils/gas';
import { roundToDecimalPlacesRemovingExtraZeroes } from '../../../../helpers/utils/util';
import { Text } from '../../../component-library';

const EditGasToolTip = ({
  editGasMode,
  estimateGreaterThanGasUse,
  gasLimit,
  priorityLevel,
  // maxFeePerGas & maxPriorityFeePerGas are derived from conditional logic
  // related to the source of the estimates. We pass these values from the
  // the parent component (edit-gas-item) rather than recalculate them
  maxFeePerGas,
  maxPriorityFeePerGas,
  transaction,
  t,
}) => {
  const toolTipMessage = useMemo(() => {
    switch (priorityLevel) {
      case PriorityLevels.low:
        return t('lowGasSettingToolTipMessage', [
          <span key={priorityLevel}>
            <b>{t('low')}</b>
          </span>,
        ]);
      case PriorityLevels.medium:
        if (estimateGreaterThanGasUse) {
          return t('disabledGasOptionToolTipMessage', [
            <span key={`disabled-priority-level-${priorityLevel}`}>
              {t(priorityLevel)}
            </span>,
          ]);
        }
        return t('mediumGasSettingToolTipMessage', [
          <span key={priorityLevel}>
            <b>{t('medium')}</b>
          </span>,
        ]);
      case PriorityLevels.high:
        if (estimateGreaterThanGasUse) {
          return t('disabledGasOptionToolTipMessage', [
            <span key={`disabled-priority-level-${priorityLevel}`}>
              {t(priorityLevel)}
            </span>,
          ]);
        }
        if (editGasMode === EditGasModes.swaps) {
          return t('swapSuggestedGasSettingToolTipMessage');
        }
        return t('highGasSettingToolTipMessage', [
          <span key={priorityLevel}>
            <b>{t('high')}</b>
          </span>,
        ]);
      case PriorityLevels.custom:
        return t('customGasSettingToolTipMessage', [
          <span key={priorityLevel}>
            <b>{t('custom')}</b>
          </span>,
        ]);
      case PriorityLevels.dAppSuggested:
        return transaction?.origin
          ? t('dappSuggestedGasSettingToolTipMessage', [
              <span key={transaction?.origin}>{transaction?.origin}</span>,
            ])
          : null;
      default:
        return '';
    }
  }, [editGasMode, estimateGreaterThanGasUse, priorityLevel, transaction, t]);

  let imgAltText;
  if (priorityLevel === PriorityLevels.low) {
    imgAltText = t('curveLowGasEstimate');
  } else if (priorityLevel === PriorityLevels.medium) {
    imgAltText = t('curveMediumGasEstimate');
  } else if (priorityLevel === PriorityLevels.high) {
    imgAltText = t('curveHighGasEstimate');
  }

  // Gas estimate curve is visible for low/medium/high gas estimates
  // the curve is not visible for high estimates for swaps
  // also it is not visible in case of cancel/speedup if the medium/high option is disabled
  const showGasEstimateCurve =
    isMetamaskSuggestedGasEstimate(priorityLevel) &&
    !(
      priorityLevel === PriorityLevels.high &&
      editGasMode === EditGasModes.swaps
    ) &&
    !estimateGreaterThanGasUse;

  return (
    <div className="edit-gas-tooltip__container">
      {showGasEstimateCurve ? (
        <img alt={imgAltText} src={`./images/curve-${priorityLevel}.svg`} />
      ) : null}
      {toolTipMessage && (
        <div className="edit-gas-tooltip__container__message">
          <Text variant={TextVariant.bodySm} as="h6">
            {toolTipMessage}
          </Text>
        </div>
      )}
      {priorityLevel === PriorityLevels.custom ||
      estimateGreaterThanGasUse ? null : (
        <div className="edit-gas-tooltip__container__values">
          <div>
            <Text
              variant={TextVariant.bodySm}
              as="h6"
              fontWeight={FontWeight.Bold}
              className="edit-gas-tooltip__container__label"
            >
              {t('maxBaseFee')}
            </Text>
            {maxFeePerGas && (
              <Text
                variant={TextVariant.bodySm}
                as="h6"
                color={TextColor.textAlternative}
                className="edit-gas-tooltip__container__value"
              >
                {roundToDecimalPlacesRemovingExtraZeroes(maxFeePerGas, 4)}
              </Text>
            )}
          </div>
          <div>
            <Text
              variant={TextVariant.bodySm}
              as="h6"
              fontWeight={FontWeight.Bold}
              className="edit-gas-tooltip__container__label"
            >
              {t('priorityFeeProperCase')}
            </Text>
            {maxPriorityFeePerGas && (
              <Text
                variant={TextVariant.bodySm}
                as="h6"
                color={TextColor.textAlternative}
                className="edit-gas-tooltip__container__value"
              >
                {roundToDecimalPlacesRemovingExtraZeroes(
                  maxPriorityFeePerGas,
                  4,
                )}
              </Text>
            )}
          </div>
          <div>
            <Text
              variant={TextVariant.bodySm}
              as="h6"
              fontWeight={FontWeight.Bold}
              className="edit-gas-tooltip__container__label"
            >
              {t('gasLimit')}
            </Text>
            {gasLimit && (
              <Text
                variant={TextVariant.bodySm}
                as="h6"
                color={TextColor.textAlternative}
                className="edit-gas-tooltip__container__value"
              >
                {roundToDecimalPlacesRemovingExtraZeroes(gasLimit, 4)}
              </Text>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

EditGasToolTip.propTypes = {
  estimateGreaterThanGasUse: PropTypes.bool,
  priorityLevel: PropTypes.string,
  maxFeePerGas: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  maxPriorityFeePerGas: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
  ]),
  t: PropTypes.func,
  editGasMode: PropTypes.string,
  gasLimit: PropTypes.number,
  transaction: PropTypes.object,
};

export default EditGasToolTip;
