import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import Typography from '../../ui/typography/typography';
import {
  FONT_WEIGHT,
  TYPOGRAPHY,
  COLORS,
} from '../../../helpers/constants/design-system';
import FormField from '../../ui/form-field';
import { GAS_ESTIMATE_TYPES } from '../../../../shared/constants/gas';

const DEFAULT_ESTIMATES_LEVEL = 'medium';

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
  maxPriorityFeeError,
  maxFeeError,
}) {
  const t = useContext(I18nContext);

  const suggestedValues = {};

  switch (gasEstimateType) {
    case GAS_ESTIMATE_TYPES.FEE_MARKET:
      suggestedValues.maxPriorityFeePerGas =
        gasFeeEstimates?.[estimateToUse]?.suggestedMaxPriorityFeePerGas;
      suggestedValues.maxFeePerGas =
        gasFeeEstimates?.[estimateToUse]?.suggestedMaxFeePerGas;
      break;
    case GAS_ESTIMATE_TYPES.LEGACY:
      suggestedValues.gasPrice = gasFeeEstimates?.[estimateToUse];
      break;
    case GAS_ESTIMATE_TYPES.ETH_GASPRICE:
      suggestedValues.gasPrice = gasFeeEstimates?.gasPrice;
      break;
    default:
      break;
  }

  const showFeeMarketFields =
    process.env.SHOW_EIP_1559_UI &&
    gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET;

  return (
    <div className="advanced-gas-controls">
      <FormField
        titleText={t('gasLimit')}
        onChange={setGasLimit}
        tooltipText=""
        value={gasLimit}
        numeric
        autoFocus
      />
      {showFeeMarketFields ? (
        <>
          <FormField
            titleText={t('maxPriorityFee')}
            titleUnit="(GWEI)"
            tooltipText=""
            onChange={(value) => {
              setMaxPriorityFee(value);
              onManualChange?.();
            }}
            value={maxPriorityFee}
            detailText={maxPriorityFeeFiat}
            numeric
            titleDetail={
              suggestedValues.maxPriorityFeePerGas && (
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
                    {
                      gasFeeEstimates?.[DEFAULT_ESTIMATES_LEVEL]
                        ?.suggestedMaxPriorityFeePerGas
                    }
                  </Typography>
                </>
              )
            }
            error={maxPriorityFeeError}
          />
          <FormField
            titleText={t('maxFee')}
            titleUnit="(GWEI)"
            tooltipText=""
            onChange={(value) => {
              setMaxFee(value);
              onManualChange?.();
            }}
            value={maxFee}
            numeric
            detailText={maxFeeFiat}
            titleDetail={
              suggestedValues.maxFeePerGas && (
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
                    {
                      gasFeeEstimates?.[DEFAULT_ESTIMATES_LEVEL]
                        ?.suggestedMaxFeePerGas
                    }
                  </Typography>
                </>
              )
            }
            error={maxFeeError}
          />
        </>
      ) : (
        <>
          <FormField
            titleText={t('gasPrice')}
            titleUnit="(GWEI)"
            onChange={(value) => {
              setGasPrice(value);
              onManualChange?.();
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
          />
        </>
      )}
    </div>
  );
}

AdvancedGasControls.propTypes = {
  estimateToUse: PropTypes.oneOf(['high', 'medium', 'low']),
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
  maxPriorityFeeError: PropTypes.string,
  maxFeeError: PropTypes.string,
};
