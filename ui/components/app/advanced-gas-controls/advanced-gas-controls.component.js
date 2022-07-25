import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { I18nContext } from '../../../contexts/i18n';
import FormField from '../../ui/form-field';
import { GAS_ESTIMATE_TYPES } from '../../../../shared/constants/gas';
import { getGasFormErrorText } from '../../../helpers/constants/gas';
import { getIsGasEstimatesLoading } from '../../../ducks/metamask/metamask';
import { getNetworkSupportsSettingGasFees } from '../../../selectors';

export default function AdvancedGasControls({
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
  supportsEIP1559,
}) {
  const t = useContext(I18nContext);
  const isGasEstimatesLoading = useSelector(getIsGasEstimatesLoading);

  const showFeeMarketFields =
    supportsEIP1559 &&
    (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET ||
      gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE ||
      isGasEstimatesLoading);

  const networkSupportsSettingGasFees = useSelector(
    getNetworkSupportsSettingGasFees,
  );

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
        disabled={!networkSupportsSettingGasFees}
        numeric
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
            disabled={!networkSupportsSettingGasFees}
          />
        </>
      )}
    </div>
  );
}

AdvancedGasControls.propTypes = {
  gasEstimateType: PropTypes.oneOf(Object.values(GAS_ESTIMATE_TYPES)),
  setMaxPriorityFee: PropTypes.func,
  setMaxFee: PropTypes.func,
  maxPriorityFee: PropTypes.string,
  maxFee: PropTypes.string,
  onManualChange: PropTypes.func,
  gasLimit: PropTypes.number,
  setGasLimit: PropTypes.func,
  gasPrice: PropTypes.string,
  setGasPrice: PropTypes.func,
  maxPriorityFeeFiat: PropTypes.string,
  maxFeeFiat: PropTypes.string,
  gasErrors: PropTypes.object,
  minimumGasLimit: PropTypes.string,
  supportsEIP1559: PropTypes.bool,
};
