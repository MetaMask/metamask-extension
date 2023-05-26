import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import FormField from '../../ui/form-field';
import { getGasFormErrorText } from '../../../helpers/constants/gas';

export default function AdvancedGasControls({
  onManualChange,
  gasLimit,
  setGasLimit,
  gasPrice,
  setGasPrice,
  gasErrors,
  minimumGasLimit,
}) {
  const t = useContext(I18nContext);

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
      />
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
          allowDecimals
          error={
            gasErrors?.gasPrice
              ? getGasFormErrorText(gasErrors.gasPrice, t)
              : null
          }
        />
      </>
    </div>
  );
}

AdvancedGasControls.propTypes = {
  onManualChange: PropTypes.func,
  gasLimit: PropTypes.number,
  setGasLimit: PropTypes.func,
  gasPrice: PropTypes.string,
  setGasPrice: PropTypes.func,
  minimumGasLimit: PropTypes.string,
  gasErrors: PropTypes.object,
};
