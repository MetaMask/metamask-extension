import React from 'react';
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
import Typography from '../../../ui/typography';

const EditGasToolTip = ({
  gasLimit,
  priorityLevel,
  // maxFeePerGas & maxPriorityFeePerGas are derived from conditional logic
  // related to the source of the estimates. We pass these values from the
  // the parent component (edit-gas-item) rather than recalculate them
  maxFeePerGas,
  maxPriorityFeePerGas,
  editGasMode,
  transaction,
  t,
}) => {
  const toolTipMessage = () => {
    switch (priorityLevel) {
      case PRIORITY_LEVELS.LOW:
        return t('lowGasSettingToolTipMessage', [
          <span key={priorityLevel}>
            <b>{t('low')}</b>
          </span>,
        ]);
      case PRIORITY_LEVELS.MEDIUM:
        return t('mediumGasSettingToolTipMessage', [
          <span key={priorityLevel}>
            <b>{t('medium')}</b>
          </span>,
        ]);
      case PRIORITY_LEVELS.HIGH:
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
  };
  return (
    <div className="edit-gas-tooltip__container">
      {priorityLevel !== PRIORITY_LEVELS.CUSTOM &&
      priorityLevel !== PRIORITY_LEVELS.DAPP_SUGGESTED &&
      !(
        priorityLevel === PRIORITY_LEVELS.HIGH &&
        editGasMode === EDIT_GAS_MODES.SWAPS
      ) ? (
        <img alt="" src={`./images/curve-${priorityLevel}.svg`} />
      ) : null}
      {priorityLevel === PRIORITY_LEVELS.HIGH &&
      editGasMode !== EDIT_GAS_MODES.SWAPS ? (
        <div className="edit-gas-tooltip__container__dialog">
          <Typography variant={TYPOGRAPHY.H7} color={COLORS.WHITE}>
            {t('highGasSettingToolTipDialog')}
          </Typography>
        </div>
      ) : null}
      <div className="edit-gas-tooltip__container__message">
        <Typography variant={TYPOGRAPHY.H7}>{toolTipMessage()}</Typography>
      </div>
      {priorityLevel === PRIORITY_LEVELS.CUSTOM ? null : (
        <div className="edit-gas-tooltip__container__values">
          <div>
            <Typography
              variant={TYPOGRAPHY.H7}
              fontWeight={FONT_WEIGHT.BOLD}
              className="edit-gas-tooltip__container__label"
            >
              {t('maxBaseFee')}
            </Typography>
            <Typography
              variant={TYPOGRAPHY.H7}
              color={COLORS.NEUTRAL_GREY}
              className="edit-gas-tooltip__container__value"
            >
              {maxFeePerGas}
            </Typography>
          </div>
          <div>
            <Typography
              variant={TYPOGRAPHY.H7}
              fontWeight={FONT_WEIGHT.BOLD}
              className="edit-gas-tooltip__container__label"
            >
              {t('priorityFeeProperCase')}
            </Typography>
            <Typography
              variant={TYPOGRAPHY.H7}
              color={COLORS.NEUTRAL_GREY}
              className="edit-gas-tooltip__container__value"
            >
              {maxPriorityFeePerGas}
            </Typography>
          </div>
          <div>
            <Typography
              variant={TYPOGRAPHY.H7}
              fontWeight={FONT_WEIGHT.BOLD}
              className="edit-gas-tooltip__container__label"
            >
              {t('gasLimit')}
            </Typography>
            <Typography
              variant={TYPOGRAPHY.H7}
              color={COLORS.NEUTRAL_GREY}
              className="edit-gas-tooltip__container__value"
            >
              {gasLimit}
            </Typography>
          </div>
        </div>
      )}
    </div>
  );
};

EditGasToolTip.propTypes = {
  priorityLevel: PropTypes.string,
  maxFeePerGas: PropTypes.string,
  maxPriorityFeePerGas: PropTypes.string,
  t: PropTypes.func,
  editGasMode: PropTypes.string,
  gasLimit: PropTypes.number,
  transaction: PropTypes.object,
};

export default EditGasToolTip;
