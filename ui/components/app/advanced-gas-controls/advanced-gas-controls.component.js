import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { I18nContext } from '../../../contexts/i18n';
import Typography from '../../ui/typography/typography';
import {
  FONT_WEIGHT,
  TYPOGRAPHY,
  COLORS,
} from '../../../helpers/constants/design-system';
import FormField from '../../ui/form-field';
import {
  GAS_ESTIMATE_TYPES,
  GAS_RECOMMENDATIONS,
} from '../../../../shared/constants/gas';
import { getGasFormErrorText } from '../../../helpers/constants/gas';
import { checkNetworkAndAccountSupports1559 } from '../../../selectors';

export default function AdvancedGasControls({
  estimateToUse,
  gasFeeEstimates,
  gasEstimateType,
  maxPriorityFee,
  maxFee,
  setMaxPriorityFee,
  setMaxFee,
  onManualChange,
  gasLimit,
  setGasLimit,
  gasPrice,
  setGasPrice,
  maxPriorityFeeFiat,
  maxFeeFiat,
  gasErrors,
  minimumGasLimit,
}) {
  const t = useContext(I18nContext);
  const networkAndAccountSupport1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );

  const suggestedValues = {};

  if (networkAndAccountSupport1559) {
    suggestedValues.maxFeePerGas =
      gasFeeEstimates?.[estimateToUse]?.suggestedMaxFeePerGas ||
      gasFeeEstimates?.gasPrice;
    suggestedValues.maxPriorityFeePerGas =
      gasFeeEstimates?.[estimateToUse]?.suggestedMaxPriorityFeePerGas ||
      suggestedValues.maxFeePerGas;
  } else {
    switch (gasEstimateType) {
      case GAS_ESTIMATE_TYPES.LEGACY:
        suggestedValues.gasPrice = gasFeeEstimates?.[estimateToUse];
        break;
      case GAS_ESTIMATE_TYPES.ETH_GASPRICE:
        suggestedValues.gasPrice = gasFeeEstimates?.gasPrice;
        break;
      default:
        break;
    }
  }

  const showFeeMarketFields =
    networkAndAccountSupport1559 &&
    (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET ||
      gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE);

  return (
    <div className="advanced-gas-controls">
      <FormField
        titleText={t('gasLimit')}
        error={
          gasErrors?.gasLimit
            ? getGasFormErrorText(gasErrors.gasLimit, t, { minimumGasLimit })
            : null
        }
        onChange={(value) => {
          onManualChange?.();
          setGasLimit(value);
        }}
        tooltipText={t('editGasLimitTooltip')}
        value={gasLimit}
        allowDecimals={false}
        numeric
        autoFocus
      />
      {showFeeMarketFields ? (
        <>
          <FormField
            titleText={t('maxPriorityFee')}
            titleUnit="(GWEI)"
            tooltipText={t('editGasMaxPriorityFeeTooltip')}
            onChange={(value) => {
              onManualChange?.();
              setMaxPriorityFee(value);
            }}
            value={maxPriorityFee}
            detailText={maxPriorityFeeFiat}
            numeric
            error={
              gasErrors?.maxPriorityFee
                ? getGasFormErrorText(gasErrors.maxPriorityFee, t)
                : null
            }
          />
          <FormField
            titleText={t('maxFee')}
            titleUnit="(GWEI)"
            tooltipText={t('editGasMaxFeeTooltip')}
            onChange={(value) => {
              onManualChange?.();
              setMaxFee(value);
            }}
            value={maxFee}
            numeric
            detailText={maxFeeFiat}
            error={
              gasErrors?.maxFee
                ? getGasFormErrorText(gasErrors.maxFee, t)
                : null
            }
          />
        </>
      ) : (
        <>
          <FormField
            titleText={t('advancedGasPriceTitle')}
            titleUnit="(GWEI)"
            onChange={(value) => {
              onManualChange?.();
              setGasPrice(value);
            }}
            tooltipText={t('editGasPriceTooltip')}
            value={gasPrice}
            numeric
            titleDetail={
              suggestedValues.gasPrice && (
                <>
                  <Typography
                    tag="span"
                    color={COLORS.UI4}
                    variant={TYPOGRAPHY.H8}
                    fontWeight={FONT_WEIGHT.BOLD}
                  >
                    {t('gasFeeEstimate')}:
                  </Typography>{' '}
                  <Typography
                    tag="span"
                    color={COLORS.UI4}
                    variant={TYPOGRAPHY.H8}
                  >
                    {suggestedValues.gasPrice}
                  </Typography>
                </>
              )
            }
            error={
              gasErrors?.gasPrice
                ? getGasFormErrorText(gasErrors.gasPrice, t)
                : null
            }
          />
        </>
      )}
    </div>
  );
}

AdvancedGasControls.propTypes = {
  estimateToUse: PropTypes.oneOf(Object.values(GAS_RECOMMENDATIONS)),
  gasFeeEstimates: PropTypes.oneOf([
    PropTypes.shape({
      gasPrice: PropTypes.string,
    }),
    PropTypes.shape({
      low: PropTypes.string,
      medium: PropTypes.string,
      high: PropTypes.string,
    }),
    PropTypes.shape({
      low: PropTypes.object,
      medium: PropTypes.object,
      high: PropTypes.object,
      estimatedBaseFee: PropTypes.string,
    }),
  ]),
  gasEstimateType: PropTypes.oneOf(Object.values(GAS_ESTIMATE_TYPES)),
  setMaxPriorityFee: PropTypes.func,
  setMaxFee: PropTypes.func,
  maxPriorityFee: PropTypes.number,
  maxFee: PropTypes.number,
  onManualChange: PropTypes.func,
  gasLimit: PropTypes.number,
  setGasLimit: PropTypes.func,
  gasPrice: PropTypes.number,
  setGasPrice: PropTypes.func,
  maxPriorityFeeFiat: PropTypes.string,
  maxFeeFiat: PropTypes.string,
  gasErrors: PropTypes.object,
  minimumGasLimit: PropTypes.number,
};
