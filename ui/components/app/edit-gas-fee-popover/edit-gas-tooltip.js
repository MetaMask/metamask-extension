import React from 'react';
import PropTypes from 'prop-types';
import { PRIORITY_LEVELS } from '../../../../shared/constants/gas';
import { COLORS, FONT_WEIGHT } from '../../../helpers/constants/design-system';
import Typography from '../../ui/typography';
import InfoTooltip from '../../ui/info-tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';

const EditGasToolTip = ({priorityLevel, gasContext}) => {
  const {
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    maxFeePerGasValue,
    maxPriorityFeePerGasValue,
    origin,
  } = gasContext;

  const t = useI18nContext();

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
                  {maxFeePerGas ?? maxFeePerGasValue}
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
  );
};

export default EditGasToolTip;
