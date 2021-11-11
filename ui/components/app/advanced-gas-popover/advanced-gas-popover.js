import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FormField from '../../ui/form-field';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Popover from '../../ui/popover';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { decGWEIToHexWEI, hexWEIToDecGWEI } from '../../../helpers/utils/conversions.util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { COLORS, FONT_WEIGHT, TYPOGRAPHY } from '../../../helpers/constants/design-system';
import Typography from '../../ui/typography';
import { divideCurrencies, multiplyCurrencies } from '../../../../shared/modules/conversion.utils';
import { SECONDARY } from '../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';

const AdvancedGasPopover = ({ onClose }) => {
  const t = useI18nContext();
  const {
    maxPriorityFeePerGas,
    maxPriorityFeePerGasFiat,
    maxFeePerGas,
    estimatedBaseFee,
  } = useGasFeeContext();

  const estimatedBaseFeeInDecGWEI = hexWEIToDecGWEI(estimatedBaseFee);
  const baseFeeMultiplier = divideCurrencies(decGWEIToHexWEI(maxFeePerGas), estimatedBaseFee, {numberOfDecimals: 2, dividendBase: 16, divisorBase:16, toNumericBase: 'dec'})
  const [maxBaseFeeMultiplier, setMaxBaseFeeMultiplier] = useState(
    baseFeeMultiplier,
  );
  const baseFee = multiplyCurrencies(estimatedBaseFee, maxBaseFeeMultiplier,{
    numberOfDecimals: 2, multiplicandBase: 16, multiplierBase:10, toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  });

  const [priorityFee, setPriorityFee] = useState(maxPriorityFeePerGas);
  const [editingInGwei, setEditingInGwei] = useState(false);

  const { currency, numberOfDecimals } = useUserPreferencedCurrency(SECONDARY);
  console.log('from popover: ', baseFee, decGWEIToHexWEI(baseFee));
  const [, {value: baseFeeInFiat}] = useCurrencyDisplay(decGWEIToHexWEI(baseFee),{currency, numberOfDecimals, from:'advancedgaspopover'});
  console.log(baseFeeInFiat)
  return (
    <Popover
      headerClassName="advanced-gas-popover__header-border"
      title="Advanced gas fee"
      onBack={() => onClose()}
      onClose={() => onClose()}
    >
      <Box className="advanced-gas-popover" margin={4} >
        <FormField
          onChange={(value) => setMaxBaseFeeMultiplier(value)}
          titleFontSize={TYPOGRAPHY.H7}
          titleText={t('maxBaseFee')}
          titleUnit={
            editingInGwei ? t('gweiInParanthesis') : t('multiplierInParathesis')
          }
          tooltipText={t('advancedBaseGasFeeToolTip')}
          titleDetail={
            editingInGwei ? (
              <Button className="advanced-gas-popover__edit-link" type="link" onClick={() => setEditingInGwei(false)}>{t('editInMultiplier')}</Button>
            ) : (
              <Button className="advanced-gas-popover__edit-link" type="link" onClick={() => setEditingInGwei(true)}>{t('editInGwei')}</Button>
            )
          }
          value={editingInGwei ? baseFee : maxBaseFeeMultiplier}
          detailText={editingInGwei ? `${maxBaseFeeMultiplier}x ≈ ${baseFeeInFiat}` :`${baseFee} GWEI ≈ ${baseFeeInFiat}`}
          numeric
          bottomBorder
          inputDetails= {
            <Box className="advanced-gas-popover__input-subtext">
              <Box className="advanced-gas-popover__input-subtext">
                <Typography 
                  tag={TYPOGRAPHY.H7} 
                  variant={TYPOGRAPHY.H7} 
                  color={COLORS.UI4}
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  {`current:`}
                </Typography>
                <Typography 
                  tag={TYPOGRAPHY.H7} 
                  variant={TYPOGRAPHY.H7} 
                  color={COLORS.UI4}
                >
                  {`${estimatedBaseFeeInDecGWEI} GWEI`}
                  <img height="18" src="./images/right-up-arrow-green.svg" alt="" />
                </Typography>
              </Box>
              <Box className="advanced-gas-popover__input-subtext">
                <Typography 
                  tag={TYPOGRAPHY.H7} 
                  variant={TYPOGRAPHY.H7} 
                  color={COLORS.UI4}
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  {`12hr:`}
                </Typography>
                <Typography 
                  tag={TYPOGRAPHY.H7} 
                  variant={TYPOGRAPHY.H7} 
                  color={COLORS.UI4}
                >
                  {`23-359 GWEI`}
                </Typography>
              </Box>
            </Box>
          }
        />
        <FormField
          onChange={(value) => setPriorityFee(value)}
          titleFontSize={TYPOGRAPHY.H7}
          titleText={t('priorityFee')}
          titleUnit={t('gweiInParanthesis')}
          tooltipText={t('advancedPriorityFeeToolTip')}
          value={priorityFee}
          detailText={`≈ ${maxPriorityFeePerGasFiat}`}
          numeric
          bottomBorder
          inputDetails= {
            <Box className="advanced-gas-popover__input-subtext">
              <Box className="advanced-gas-popover__input-subtext">
                <Typography 
                  tag={TYPOGRAPHY.H7} 
                  variant={TYPOGRAPHY.H7} 
                  color={COLORS.UI4}
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  {`current:`}
                </Typography>
                <Typography 
                  tag={TYPOGRAPHY.H7} 
                  variant={TYPOGRAPHY.H7} 
                  color={COLORS.UI4}
                >
                  {`${estimatedBaseFeeInDecGWEI} GWEI`}
                </Typography>
              </Box>
              <Box className="advanced-gas-popover__input-subtext">
                <Typography 
                  tag={TYPOGRAPHY.H7} 
                  variant={TYPOGRAPHY.H7} 
                  color={COLORS.UI4}
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  {`12hr:`}
                </Typography>
                <Typography 
                  tag={TYPOGRAPHY.H7} 
                  variant={TYPOGRAPHY.H7} 
                  color={COLORS.UI4}
                >
                  {`23-359 GWEI`}
                </Typography>
              </Box>
            </Box>
          }
        />
      </Box>
    </Popover>
  );
};

AdvancedGasPopover.propTypes = {
  onClose: PropTypes.func,
};

export default AdvancedGasPopover;
