import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import {
  GAS_RECOMMENDATIONS,
  EDIT_GAS_MODES,
} from '../../../../shared/constants/gas';

import { isEIP1559Network } from '../../../ducks/metamask/metamask';

import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import { areDappSuggestedAndTxParamGasFeesTheSame } from '../../../helpers/utils/confirm-tx.util';

import InfoTooltip from '../../ui/info-tooltip';
import TransactionTotalBanner from '../transaction-total-banner/transaction-total-banner.component';
import RadioGroup from '../../ui/radio-group/radio-group.component';
import AdvancedGasControls from '../advanced-gas-controls/advanced-gas-controls.component';
import ActionableMessage from '../../ui/actionable-message/actionable-message';

import { I18nContext } from '../../../contexts/i18n';
import GasTiming from '../gas-timing';

export default function EditGasDisplay({
  mode = EDIT_GAS_MODES.MODIFY_IN_PLACE,
  showEducationButton = false,
  onEducationClick,
  transaction,
  defaultEstimateToUse,
  maxPriorityFeePerGas,
  setMaxPriorityFeePerGas,
  maxPriorityFeePerGasFiat,
  maxFeePerGas,
  setMaxFeePerGas,
  maxFeePerGasFiat,
  estimatedMaximumNative,
  isGasEstimatesLoading,
  gasFeeEstimates,
  gasEstimateType,
  gasPrice,
  setGasPrice,
  gasLimit,
  setGasLimit,
  estimateToUse,
  setEstimateToUse,
  estimatedMinimumFiat,
  estimatedMaximumFiat,
  hasGasErrors,
  dappSuggestedGasFeeAcknowledged,
  setDappSuggestedGasFeeAcknowledged,
  showAdvancedForm,
  setShowAdvancedForm,
  warning,
  gasErrors,
  onManualChange,
  networkSupports1559,
}) {
  const t = useContext(I18nContext);

  const dappSuggestedAndTxParamGasFeesAreTheSame = areDappSuggestedAndTxParamGasFeesTheSame(
    transaction,
  );

  const requireDappAcknowledgement = Boolean(
    transaction?.dappSuggestedGasFees &&
      !dappSuggestedGasFeeAcknowledged &&
      dappSuggestedAndTxParamGasFeesAreTheSame,
  );

  const networkSupports1559 = useSelector(isEIP1559Network);

  return (
    <div className="edit-gas-display">
      <div className="edit-gas-display__content">
        {warning && (
          <div className="edit-gas-display__warning">
            <ActionableMessage
              className="actionable-message--warning"
              message={warning}
            />
          </div>
        )}
        {requireDappAcknowledgement && (
          <div className="edit-gas-display__dapp-acknowledgement-warning">
            <ActionableMessage
              className="actionable-message--warning"
              message={t('gasDisplayDappWarning', [transaction.origin])}
              iconFillColor="#f8c000"
              useIcon
            />
          </div>
        )}
        {mode === EDIT_GAS_MODES.SPEED_UP && (
          <div className="edit-gas-display__top-tooltip">
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H8}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('speedUpTooltipText')}{' '}
              <InfoTooltip
                position="top"
                contentText={t('speedUpExplanation')}
              />
            </Typography>
          </div>
        )}
        <TransactionTotalBanner
          total={
            networkSupports1559
              ? `~ ${estimatedMinimumFiat}`
              : estimatedMaximumNative
          }
          detail={
            networkSupports1559 &&
            estimatedMaximumFiat !== undefined &&
            t('editGasTotalBannerSubtitle', [
              <Typography
                fontWeight={FONT_WEIGHT.BOLD}
                tag="span"
                key="secondary"
              >
                {estimatedMaximumFiat}
              </Typography>,
              <Typography tag="span" key="primary">
                {estimatedMaximumNative}
              </Typography>,
            ])
          }
          timing={<GasTiming maxPriorityFeePerGas={maxPriorityFeePerGas} />}
        />
        {requireDappAcknowledgement && (
          <Button
            className="edit-gas-display__dapp-acknowledgement-button"
            onClick={() => setDappSuggestedGasFeeAcknowledged(true)}
          >
            {t('gasDisplayAcknowledgeDappButtonText')}
          </Button>
        )}
        {hasGasErrors && (
          <div className="edit-gas-display__error">
            <Typography
              color={COLORS.ERROR1}
              variant={TYPOGRAPHY.H7}
              align={TEXT_ALIGN.CENTER}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('editGasTooLow')}{' '}
              <InfoTooltip
                position="top"
                contentText={t('editGasTooLowTooltip')}
              />
            </Typography>
          </div>
        )}
        {networkSupports1559 &&
          !requireDappAcknowledgement &&
          ![EDIT_GAS_MODES.SPEED_UP, EDIT_GAS_MODES.CANCEL].includes(mode) && (
            <RadioGroup
              name="gas-recommendation"
              options={[
                {
                  value: GAS_RECOMMENDATIONS.LOW,
                  label: t('editGasLow'),
                  recommended: defaultEstimateToUse === GAS_RECOMMENDATIONS.LOW,
                },
                {
                  value: GAS_RECOMMENDATIONS.MEDIUM,
                  label: t('editGasMedium'),
                  recommended:
                    defaultEstimateToUse === GAS_RECOMMENDATIONS.MEDIUM,
                },
                {
                  value: GAS_RECOMMENDATIONS.HIGH,
                  label: t('editGasHigh'),
                  recommended:
                    defaultEstimateToUse === GAS_RECOMMENDATIONS.HIGH,
                },
              ]}
              selectedValue={estimateToUse}
              onChange={setEstimateToUse}
            />
          )}
        {!requireDappAcknowledgement && (
          <button
            className="edit-gas-display__advanced-button"
            onClick={() => setShowAdvancedForm(!showAdvancedForm)}
          >
            {t('advancedOptions')}{' '}
            {showAdvancedForm ? (
              <i className="fa fa-caret-up"></i>
            ) : (
              <i className="fa fa-caret-down"></i>
            )}
          </button>
        )}
        {!requireDappAcknowledgement && showAdvancedForm && (
          <AdvancedGasControls
            gasFeeEstimates={gasFeeEstimates}
            gasEstimateType={gasEstimateType}
            estimateToUse={estimateToUse}
            isGasEstimatesLoading={isGasEstimatesLoading}
            gasLimit={gasLimit}
            setGasLimit={setGasLimit}
            maxPriorityFee={maxPriorityFeePerGas}
            setMaxPriorityFee={setMaxPriorityFeePerGas}
            maxFee={maxFeePerGas}
            setMaxFee={setMaxFeePerGas}
            gasPrice={gasPrice}
            setGasPrice={setGasPrice}
            maxPriorityFeeFiat={maxPriorityFeePerGasFiat}
            maxFeeFiat={maxFeePerGasFiat}
            gasErrors={gasErrors}
            onManualChange={onManualChange}
          />
        )}
      </div>
      {networkSupports1559 &&
        !requireDappAcknowledgement &&
        showEducationButton && (
          <div className="edit-gas-display__education">
            <button onClick={onEducationClick}>
              {t('editGasEducationButtonText')}
            </button>
          </div>
        )}
    </div>
  );
}

EditGasDisplay.propTypes = {
  mode: PropTypes.oneOf(Object.values(EDIT_GAS_MODES)),
  showEducationButton: PropTypes.bool,
  onEducationClick: PropTypes.func,
  defaultEstimateToUse: PropTypes.oneOf(Object.values(GAS_RECOMMENDATIONS)),
  maxPriorityFeePerGas: PropTypes.string,
  setMaxPriorityFeePerGas: PropTypes.func,
  maxPriorityFeePerGasFiat: PropTypes.string,
  maxFeePerGas: PropTypes.string,
  setMaxFeePerGas: PropTypes.func,
  maxFeePerGasFiat: PropTypes.string,
  estimatedMaximumNative: PropTypes.string,
  isGasEstimatesLoading: PropTypes.boolean,
  gasFeeEstimates: PropTypes.object,
  gasEstimateType: PropTypes.string,
  gasPrice: PropTypes.string,
  setGasPrice: PropTypes.func,
  gasLimit: PropTypes.number,
  setGasLimit: PropTypes.func,
  estimateToUse: PropTypes.string,
  setEstimateToUse: PropTypes.func,
  estimatedMinimumFiat: PropTypes.string,
  estimatedMaximumFiat: PropTypes.string,
  hasGasErrors: PropTypes.boolean,
  dappSuggestedGasFeeAcknowledged: PropTypes.boolean,
  setDappSuggestedGasFeeAcknowledged: PropTypes.func,
  showAdvancedForm: PropTypes.bool,
  setShowAdvancedForm: PropTypes.func,
  warning: PropTypes.string,
  transaction: PropTypes.object,
  gasErrors: PropTypes.object,
  onManualChange: PropTypes.func,
  networkSupports1559: PropTypes.boolean,
};
