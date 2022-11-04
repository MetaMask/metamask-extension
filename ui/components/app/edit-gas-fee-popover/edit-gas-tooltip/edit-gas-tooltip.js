import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  EDIT_GAS_MODES,
  PRIORITY_LEVELS,
} from '../../../../../shared/constants/gas';
import {
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import { isMetamaskSuggestedGasEstimate } from '../../../../helpers/utils/gas';
import { roundToDecimalPlacesRemovingExtraZeroes } from '../../../../helpers/utils/util';
import Typography from '../../../ui/typography';

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
      case PRIORITY_LEVELS.LOW:
        return t('lowGasSettingToolTipMessage', [
          <span key={priorityLevel}>
            <b>{t('low')}</b>
          </span>,
        ]);
      case PRIORITY_LEVELS.MEDIUM:
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
      case PRIORITY_LEVELS.HIGH:
        if (estimateGreaterThanGasUse) {
          return t('disabledGasOptionToolTipMessage', [
            <span key={`disabled-priority-level-${priorityLevel}`}>
              {t(priorityLevel)}
            </span>,
          ]);
        }
        if (editGasMode === EDIT_GAS_MODES.SWAPS) {
          return t('swapSuggestedGasSettingToolTipMessage');
        }
        return t('highGasSettingToolTipMessage', [
          <span key={priorityLevel}>
            <b>{t('high')}</b>
          </span>,
        ]);
      case PRIORITY_LEVELS.CUSTOM:
        return t('customGasSettingToolTipMessage', [
          <span key={priorityLevel}>
            <b>{t('custom')}</b>
          </span>,
        ]);
      case PRIORITY_LEVELS.DAPP_SUGGESTED:
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
  if (priorityLevel === PRIORITY_LEVELS.LOW) {
    imgAltText = t('curveLowGasEstimate');
  } else if (priorityLevel === PRIORITY_LEVELS.MEDIUM) {
    imgAltText = t('curveMediumGasEstimate');
  } else if (priorityLevel === PRIORITY_LEVELS.HIGH) {
    imgAltText = t('curveHighGasEstimate');
  }

  // Gas estimate curve is visible for low/medium/high gas estimates
  // the curve is not visible for high estimates for swaps
  // also it is not visible in case of cancel/speedup if the medium/high option is disabled
  const showGasEstimateCurve =
    isMetamaskSuggestedGasEstimate(priorityLevel) &&
    !(
      priorityLevel === PRIORITY_LEVELS.HIGH &&
      editGasMode === EDIT_GAS_MODES.SWAPS
    ) &&
    !estimateGreaterThanGasUse;

  return (
    <div className="edit-gas-tooltip__container">
      {showGasEstimateCurve ? (
        <img alt={imgAltText} src={`./images/curve-${priorityLevel}.svg`} />
      ) : null}
      {toolTipMessage && (
        <div className="edit-gas-tooltip__container__message">
          <Typography variant={TYPOGRAPHY.H7}>{toolTipMessage}</Typography>
        </div>
      )}
      {priorityLevel === PRIORITY_LEVELS.CUSTOM ||
      estimateGreaterThanGasUse ? null : (
        <div className="edit-gas-tooltip__container__values">
          <div>
            <Typography
              variant={TYPOGRAPHY.H7}
              fontWeight={FONT_WEIGHT.BOLD}
              className="edit-gas-tooltip__container__label"
            >
              {t('maxBaseFee')}
            </Typography>
            {maxFeePerGas && (
              <Typography
                variant={TYPOGRAPHY.H7}
                color={COLORS.TEXT_ALTERNATIVE}
                className="edit-gas-tooltip__container__value"
              >
                {roundToDecimalPlacesRemovingExtraZeroes(maxFeePerGas, 4)}
              </Typography>
            )}
          </div>
          <div>
            <Typography
              variant={TYPOGRAPHY.H7}
              fontWeight={FONT_WEIGHT.BOLD}
              className="edit-gas-tooltip__container__label"
            >
              {t('priorityFeeProperCase')}
            </Typography>
            {maxPriorityFeePerGas && (
              <Typography
                variant={TYPOGRAPHY.H7}
                color={COLORS.TEXT_ALTERNATIVE}
                className="edit-gas-tooltip__container__value"
              >
                {roundToDecimalPlacesRemovingExtraZeroes(
                  maxPriorityFeePerGas,
                  4,
                )}
              </Typography>
            )}
          </div>
          <div>
            <Typography
              variant={TYPOGRAPHY.H7}
              fontWeight={FONT_WEIGHT.BOLD}
              className="edit-gas-tooltip__container__label"
            >
              {t('gasLimit')}
            </Typography>
            {gasLimit && (
              <Typography
                variant={TYPOGRAPHY.H7}
                color={COLORS.TEXT_ALTERNATIVE}
                className="edit-gas-tooltip__container__value"
              >
                {roundToDecimalPlacesRemovingExtraZeroes(gasLimit, 4)}
              </Typography>
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
