import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

import { getMaximumGasTotalInHexWei } from '../../../../../shared/modules/gas.utils';
import { PRIORITY_LEVELS } from '../../../../../shared/constants/gas';
import { PRIORITY_LEVEL_ICON_MAP } from '../../../../helpers/constants/gas';
import { PRIMARY } from '../../../../helpers/constants/common';
import {
  decGWEIToHexWEI,
  decimalToHex,
  hexWEIToDecGWEI,
} from '../../../../helpers/utils/conversions.util';
import { getAdvancedGasFeeValues } from '../../../../selectors';
import { toHumanReadableTime } from '../../../../helpers/utils/util';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';
import I18nValue from '../../../ui/i18n-value';
import InfoTooltip from '../../../ui/info-tooltip';
import UserPreferencedCurrencyDisplay from '../../user-preferenced-currency-display';

import Typography from '../../../ui/typography';
import {
  COLORS,
  FONT_WEIGHT,
} from '../../../../helpers/constants/design-system';
import { useCustomTimeEstimate } from './useCustomTimeEstimate';

const EditGasItem = ({ priorityLevel }) => {
  const {
    estimateUsed,
    gasFeeEstimates,
    gasLimit,
    maxFeePerGas: maxFeePerGasValue,
    maxPriorityFeePerGas: maxPriorityFeePerGasValue,
    updateTransactionUsingGasFeeEstimates,
    transaction: { dappSuggestedGasFees, origin },
  } = useGasFeeContext();
  const t = useI18nContext();
  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);
  const { closeModal, openModal } = useTransactionModalContext();

  let maxFeePerGas;
  let maxPriorityFeePerGas;
  let minWaitTime;

  if (gasFeeEstimates?.[priorityLevel]) {
    maxFeePerGas = gasFeeEstimates[priorityLevel].suggestedMaxFeePerGas;
    maxPriorityFeePerGas =
      gasFeeEstimates[priorityLevel].suggestedMaxPriorityFeePerGas;
  } else if (
    priorityLevel === PRIORITY_LEVELS.DAPP_SUGGESTED &&
    dappSuggestedGasFees
  ) {
    maxFeePerGas = hexWEIToDecGWEI(
      dappSuggestedGasFees.maxFeePerGas ?? dappSuggestedGasFees.gasPrice,
    );
    maxPriorityFeePerGas = hexWEIToDecGWEI(
      dappSuggestedGasFees.maxPriorityFeePerGas ??
        // TODO should this default back to something else? Will definitely be too high in this case
        dappSuggestedGasFees.gasPrice,
    );
  } else if (priorityLevel === PRIORITY_LEVELS.CUSTOM) {
    if (estimateUsed === PRIORITY_LEVELS.CUSTOM) {
      maxFeePerGas = maxFeePerGasValue;
      maxPriorityFeePerGas = maxPriorityFeePerGasValue;
    } else if (advancedGasFeeValues) {
      maxFeePerGas =
        gasFeeEstimates.estimatedBaseFee *
        parseFloat(advancedGasFeeValues.maxBaseFee);
      maxPriorityFeePerGas = advancedGasFeeValues.priorityFee;
    }
  }

  const { waitTimeEstimate } = useCustomTimeEstimate({
    gasFeeEstimates,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });

  if (gasFeeEstimates[priorityLevel]) {
    minWaitTime =
      priorityLevel === PRIORITY_LEVELS.HIGH
        ? gasFeeEstimates?.high.minWaitTimeEstimate
        : gasFeeEstimates?.low.maxWaitTimeEstimate;
  } else {
    minWaitTime = waitTimeEstimate;
  }

  const hexMaximumTransactionFee = maxFeePerGas
    ? getMaximumGasTotalInHexWei({
        gasLimit: decimalToHex(gasLimit),
        maxFeePerGas: decGWEIToHexWEI(maxFeePerGas),
      })
    : null;

  const onOptionSelect = () => {
    if (priorityLevel === PRIORITY_LEVELS.CUSTOM) {
      openModal('advancedGasFee');
    } else {
      updateTransactionUsingGasFeeEstimates(priorityLevel);
      closeModal('editGasFee');
    }
  };

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
        return t('dappSuggestedGasSettingToolTipMessage', [
          <span key={origin}>{origin}</span>,
        ]);
      default:
        return '';
    }
  };

  return (
    <button
      className={classNames('edit-gas-item', {
        'edit-gas-item-selected': priorityLevel === estimateUsed,
        'edit-gas-item-disabled':
          priorityLevel === PRIORITY_LEVELS.DAPP_SUGGESTED &&
          !dappSuggestedGasFees,
      })}
      disabled={
        priorityLevel === PRIORITY_LEVELS.DAPP_SUGGESTED &&
        !dappSuggestedGasFees
      }
      onClick={onOptionSelect}
      aria-label={priorityLevel}
      autoFocus={priorityLevel === estimateUsed}
    >
      <span className="edit-gas-item__name">
        <span
          className={`edit-gas-item__icon edit-gas-item__icon-${priorityLevel}`}
        >
          {PRIORITY_LEVEL_ICON_MAP[priorityLevel]}
        </span>
        <I18nValue
          messageKey={
            priorityLevel === PRIORITY_LEVELS.DAPP_SUGGESTED
              ? 'dappSuggestedShortLabel'
              : priorityLevel
          }
        />
      </span>
      <span
        className={`edit-gas-item__time-estimate edit-gas-item__time-estimate-${priorityLevel}`}
      >
        {minWaitTime
          ? minWaitTime && toHumanReadableTime(t, minWaitTime)
          : '--'}
      </span>
      <span
        className={`edit-gas-item__fee-estimate edit-gas-item__fee-estimate-${priorityLevel}`}
      >
        {hexMaximumTransactionFee ? (
          <UserPreferencedCurrencyDisplay
            key="editGasSubTextFeeAmount"
            type={PRIMARY}
            value={hexMaximumTransactionFee}
          />
        ) : (
          '--'
        )}
      </span>
      <span className="edit-gas-item__tooltip">
        <InfoTooltip
          contentText={
            <div className="edit-gas-item__tooltip__container">
              {priorityLevel !== PRIORITY_LEVELS.CUSTOM &&
              priorityLevel !== PRIORITY_LEVELS.DAPP_SUGGESTED ? (
                <img
                  alt=""
                  width={130}
                  src={`./images/curve-${priorityLevel}.svg`}
                />
              ) : null}
              {priorityLevel === PRIORITY_LEVELS.HIGH ? (
                <div className="edit-gas-item__tooltip__container__dialog">
                  <Typography fontSize="12px" color={COLORS.WHITE}>
                    {t('highGasSettingToolTipDialog')}
                  </Typography>
                </div>
              ) : null}
              <div className="edit-gas-item__tooltip__container__message">
                <Typography fontSize="12px">{toolTipMessage()}</Typography>
              </div>
              {priorityLevel === PRIORITY_LEVELS.CUSTOM ? null : (
                <div className="edit-gas-item__tooltip__container__values">
                  <div>
                    <Typography
                      fontSize="12px"
                      fontWeight={FONT_WEIGHT.BOLD}
                      margin={0}
                      className="edit-gas-item__tooltip__container__label"
                    >
                      {t('maxBaseFee')}
                    </Typography>
                    <Typography
                      fontSize="12px"
                      color={COLORS.NEUTRAL_GREY}
                      margin={0}
                      className="edit-gas-item__tooltip__container__value"
                    >
                      {maxFeePerGas}
                    </Typography>
                  </div>
                  <div>
                    <Typography
                      fontSize="12px"
                      fontWeight={FONT_WEIGHT.BOLD}
                      margin={0}
                      className="edit-gas-item__tooltip__container__label"
                    >
                      {t('priorityFee')}
                    </Typography>
                    <Typography
                      fontSize="12px"
                      color={COLORS.NEUTRAL_GREY}
                      margin={0}
                      className="edit-gas-item__tooltip__container__value"
                    >
                      {maxPriorityFeePerGas ?? maxPriorityFeePerGasValue}
                    </Typography>
                  </div>
                  <div>
                    <Typography
                      fontSize="12px"
                      fontWeight={FONT_WEIGHT.BOLD}
                      margin={0}
                      className="edit-gas-item__tooltip__container__label"
                    >
                      {t('gasLimit')}
                    </Typography>
                    <Typography
                      fontSize="12px"
                      color={COLORS.NEUTRAL_GREY}
                      margin={0}
                      className="edit-gas-item__tooltip__container__value"
                    >
                      {gasLimit}
                    </Typography>
                  </div>
                </div>
              )}
            </div>
          }
          position="top"
        />
      </span>
    </button>
  );
};

EditGasItem.propTypes = {
  priorityLevel: PropTypes.string,
};

export default EditGasItem;
