import React, { useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import {
  GAS_RECOMMENDATIONS,
  EDIT_GAS_MODES,
  GAS_ESTIMATE_TYPES,
} from '../../../../shared/constants/gas';

import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import {
  getIsMainnet,
  checkNetworkAndAccountSupports1559,
  getAdvancedInlineGasShown,
} from '../../../selectors';

import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import { areDappSuggestedAndTxParamGasFeesTheSame } from '../../../helpers/utils/confirm-tx.util';

import InfoTooltip from '../../ui/info-tooltip';
import ErrorMessage from '../../ui/error-message';
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
  estimatedMinimumNative,
  isGasEstimatesLoading,
  gasEstimateType,
  gasPrice,
  setGasPrice,
  gasLimit,
  setGasLimit,
  estimateToUse,
  setEstimateToUse,
  estimatedMinimumFiat,
  estimatedMaximumFiat,
  dappSuggestedGasFeeAcknowledged,
  setDappSuggestedGasFeeAcknowledged,
  warning,
  gasErrors,
  gasWarnings,
  onManualChange,
  minimumGasLimit,
  balanceError,
  estimatesUnavailableWarning,
  hasGasErrors,
  txParamsHaveBeenCustomized,
}) {
  const t = useContext(I18nContext);
  const isMainnet = useSelector(getIsMainnet);
  const networkAndAccountSupport1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const showAdvancedInlineGasIfPossible = useSelector(
    getAdvancedInlineGasShown,
  );

  const [showAdvancedForm, setShowAdvancedForm] = useState(
    !estimateToUse ||
      estimateToUse === 'custom' ||
      !networkAndAccountSupport1559,
  );
  const [hideRadioButtons, setHideRadioButtons] = useState(
    showAdvancedInlineGasIfPossible,
  );

  const dappSuggestedAndTxParamGasFeesAreTheSame = areDappSuggestedAndTxParamGasFeesTheSame(
    transaction,
  );

  const requireDappAcknowledgement = Boolean(
    transaction?.dappSuggestedGasFees &&
      !dappSuggestedGasFeeAcknowledged &&
      dappSuggestedAndTxParamGasFeesAreTheSame,
  );

  const showTopError =
    (balanceError || estimatesUnavailableWarning) &&
    (!isGasEstimatesLoading || txParamsHaveBeenCustomized);
  const radioButtonsEnabled =
    networkAndAccountSupport1559 &&
    gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET &&
    !requireDappAcknowledgement;

  let errorKey;
  if (balanceError) {
    errorKey = 'insufficientFunds';
  } else if (estimatesUnavailableWarning) {
    errorKey = 'gasEstimatesUnavailableWarning';
  }

  return (
    <div className="edit-gas-display">
      <div className="edit-gas-display__content">
        {warning && !isGasEstimatesLoading && (
          <div className="edit-gas-display__warning">
            <ActionableMessage
              className="actionable-message--warning"
              message={warning}
            />
          </div>
        )}
        {showTopError && (
          <div className="edit-gas-display__warning">
            <ErrorMessage errorKey={errorKey} />
          </div>
        )}
        {requireDappAcknowledgement && !isGasEstimatesLoading && (
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
            (networkAndAccountSupport1559 || isMainnet) && estimatedMinimumFiat
              ? `~ ${estimatedMinimumFiat}`
              : estimatedMinimumNative
          }
          detail={
            networkAndAccountSupport1559 &&
            estimatedMaximumFiat !== undefined && (
              <>
                <Typography
                  tag="span"
                  key="label"
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  {t('editGasSubTextFeeLabel')}
                </Typography>
                <Typography tag="span" key="secondary">
                  {estimatedMaximumFiat}
                </Typography>
                <Typography tag="span" key="primary">
                  {`(${estimatedMaximumNative})`}
                </Typography>
              </>
            )
          }
          timing={
            hasGasErrors === false && (
              <GasTiming
                maxFeePerGas={maxFeePerGas}
                maxPriorityFeePerGas={maxPriorityFeePerGas}
                gasWarnings={gasWarnings}
              />
            )
          }
        />
        {requireDappAcknowledgement && (
          <Button
            className="edit-gas-display__dapp-acknowledgement-button"
            onClick={() => setDappSuggestedGasFeeAcknowledged(true)}
          >
            {t('gasDisplayAcknowledgeDappButtonText')}
          </Button>
        )}
        {!requireDappAcknowledgement &&
          radioButtonsEnabled &&
          showAdvancedInlineGasIfPossible && (
            <button
              className="edit-gas-display__advanced-button"
              onClick={() => setHideRadioButtons(!hideRadioButtons)}
            >
              {t('showRecommendations')}{' '}
              {hideRadioButtons ? (
                <i className="fa fa-caret-down"></i>
              ) : (
                <i className="fa fa-caret-up"></i>
              )}
            </button>
          )}
        {radioButtonsEnabled && !hideRadioButtons && (
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
                recommended: defaultEstimateToUse === GAS_RECOMMENDATIONS.HIGH,
              },
            ]}
            selectedValue={estimateToUse}
            onChange={setEstimateToUse}
          />
        )}
        {!requireDappAcknowledgement &&
          radioButtonsEnabled &&
          !showAdvancedInlineGasIfPossible && (
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
        {!requireDappAcknowledgement &&
          (showAdvancedForm ||
            hasGasErrors ||
            estimatesUnavailableWarning ||
            showAdvancedInlineGasIfPossible) && (
            <AdvancedGasControls
              gasEstimateType={gasEstimateType}
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
              minimumGasLimit={minimumGasLimit}
            />
          )}
      </div>
      {networkAndAccountSupport1559 &&
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
  estimatedMinimumNative: PropTypes.string,
  isGasEstimatesLoading: PropTypes.bool,
  gasEstimateType: PropTypes.string,
  gasPrice: PropTypes.string,
  setGasPrice: PropTypes.func,
  gasLimit: PropTypes.number,
  setGasLimit: PropTypes.func,
  estimateToUse: PropTypes.string,
  setEstimateToUse: PropTypes.func,
  estimatedMinimumFiat: PropTypes.string,
  estimatedMaximumFiat: PropTypes.string,
  dappSuggestedGasFeeAcknowledged: PropTypes.bool,
  setDappSuggestedGasFeeAcknowledged: PropTypes.func,
  warning: PropTypes.string,
  transaction: PropTypes.object,
  gasErrors: PropTypes.object,
  gasWarnings: PropTypes.object,
  onManualChange: PropTypes.func,
  minimumGasLimit: PropTypes.string,
  balanceError: PropTypes.bool,
  estimatesUnavailableWarning: PropTypes.bool,
  hasGasErrors: PropTypes.bool,
  txParamsHaveBeenCustomized: PropTypes.bool,
};
