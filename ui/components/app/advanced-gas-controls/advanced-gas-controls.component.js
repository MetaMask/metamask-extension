import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import { getGasFormErrorText } from '../../../helpers/constants/gas';
import { DECIMAL_REGEX } from '../../../../shared/constants/tokens';
import {
  Display,
  AlignItems,
  FontWeight,
} from '../../../helpers/constants/design-system';
import InfoTooltip from '../../ui/info-tooltip/info-tooltip';
import { Box, Label, FormTextField, Text } from '../../component-library';

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
  const handleOnChange = (e) => {
    const newValue = e.target.value;
    const match = DECIMAL_REGEX.exec(newValue);
    if (match?.[1]?.length >= 15) {
      return;
    }
    onManualChange?.(parseFloat(newValue || 0, 10));
  };
  return (
    <div className="advanced-gas-controls">
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
        <Label htmlFor="gas-limit">{t('gasLimit')}</Label>
        <InfoTooltip contentText={t('editGasLimitTooltip')} position="bottom" />
      </Box>
      <FormTextField
        id="gas-limit"
        value={gasLimit}
        type="number"
        placeholder="0"
        marginBottom={4}
        error={Boolean(gasErrors?.gasLimit)}
        helpText={
          gasErrors?.gasLimit
            ? getGasFormErrorText(gasErrors.gasLimit, t, { minimumGasLimit })
            : null
        }
        onChange={(e) => {
          handleOnChange(e);
          setGasLimit(e);
        }}
        inputProps={{
          onKeyDown: (e) => {
            // prevent decimals
            if (e.key === '.') {
              e.preventDefault();
            }
          },
          min: 0,
          className: 'advanced-gas-controls__input',
        }}
      />
      <>
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
          <Label htmlFor="gas-price">
            {t('advancedGasPriceTitle')}{' '}
            <Text marginLeft={1} as="span" fontWeight={FontWeight.Normal}>
              (GWEI)
            </Text>
          </Label>
          <InfoTooltip contentText={t('editGasPriceTooltip')} position="top" />
        </Box>
        <FormTextField
          id="gas-price"
          value={gasPrice}
          type="number"
          placeholder="0"
          onChange={(e) => {
            handleOnChange(e);
            setGasPrice(e);
          }}
          error={Boolean(gasErrors?.gasPrice)}
          helpText={
            gasErrors?.gasPrice
              ? getGasFormErrorText(gasErrors.gasPrice, t)
              : null
          }
          inputProps={{ min: 0, className: 'advanced-gas-controls__input' }}
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
