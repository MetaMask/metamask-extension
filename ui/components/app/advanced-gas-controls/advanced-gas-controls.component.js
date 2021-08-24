import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { hexToDecimal } from '../../../helpers/utils/conversions.util';
import { I18nContext } from '../../../contexts/i18n';
import FormField from '../../ui/form-field';
import { GAS_ESTIMATE_TYPES } from '../../../../shared/constants/gas';
import { getGasFormErrorText } from '../../../helpers/constants/gas';
import { checkNetworkAndAccountSupports1559 } from '../../../selectors';
import { useGasFeeInputs } from '../../../hooks/useGasFeeInputs';

export default function AdvancedGasControls({
  defaultEstimateToUse,
  transaction,
  minimumGasLimitHex,
  mode,
  className,
}) {
  const t = useContext(I18nContext);

  const {
    maxPriorityFeePerGas: maxPriorityFee,
    setMaxPriorityFeePerGas: setMaxPriorityFee,
    maxPriorityFeePerGasFiat: maxPriorityFeeFiat,
    maxFeePerGas: maxFee,
    setMaxFeePerGas: setMaxFee,
    maxFeePerGasFiat: maxFeeFiat,
    isGasEstimatesLoading,
    gasEstimateType,
    gasPrice,
    setGasPrice,
    gasLimit,
    setGasLimit,
    gasErrors,
    onManualChange,
  } = useGasFeeInputs(
    defaultEstimateToUse,
    transaction,
    minimumGasLimitHex,
    mode,
  );

  const networkAndAccountSupport1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );

  const showFeeMarketFields =
    networkAndAccountSupport1559 &&
    (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET ||
      gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE ||
      isGasEstimatesLoading);

  return (
    <div className={classnames('advanced-gas-controls', className)}>
      <FormField
        titleText={t('gasLimit')}
        error={
          gasErrors?.gasLimit
            ? getGasFormErrorText(gasErrors.gasLimit, t, {
                minimumGasLimit: hexToDecimal(minimumGasLimitHex),
              })
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
  className: PropTypes.string,
  defaultEstimateToUse: PropTypes.string,
  transaction: PropTypes.object,
  minimumGasLimitHex: PropTypes.string,
  mode: PropTypes.string,
};
