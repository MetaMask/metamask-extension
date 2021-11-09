import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import FormField from '../../ui/form-field';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Popover from '../../ui/popover';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { decGWEIToHexWEI, hexWEIToDecGWEI } from '../../../helpers/utils/conversions.util';
import {
  BnMultiplyByFraction,
  hexToBn,
} from '../../../../app/scripts/lib/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BORDER_STYLE, COLORS, FLEX_DIRECTION, TYPOGRAPHY } from '../../../helpers/constants/design-system';
import Typography from '../../ui/typography';

const AdvancedGasPopover = ({ onClose }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const {
    maxPriorityFeePerGas,
    maxPriorityFeePerGasFiat,
    setMaxPriorityFeePerGas,
    maxFeePerGas,
    setMaxFeePerGas,
    estimatedBaseFee,
  } = useGasFeeContext();
  const estimatedBaseFeeInDecGWEI = hexWEIToDecGWEI(estimatedBaseFee);
  const baseFeeMultiplier = BnMultiplyByFraction(
    hexToBn(decGWEIToHexWEI(maxFeePerGas)),
    1,
    estimatedBaseFee,
  ).toString(10);
  const [maxBaseFeeMultiplier, setMaxBaseFeeMultiplier] = useState(
    baseFeeMultiplier,
  );
  const [priorityFee, setPriorityFee] = useState(maxPriorityFeePerGas);
  const baseFee = BnMultiplyByFraction(
    hexToBn(estimatedBaseFee),
    maxBaseFeeMultiplier,
    1,
  ).toString(10);
  const [editingInGwei, setEditingInGwei] = useState(false);

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
          value={maxBaseFeeMultiplier}
          detailText={editingInGwei ? `x ≈ $` :`${baseFee} GWEI ≈ $`}
          numeric
          bottomBorder
          inputDetails= {
            <Box>
              <Typography 
                tag={TYPOGRAPHY.H7} 
                variant={TYPOGRAPHY.H7} 
                color={COLORS.UI4}
              >
                {`current: 192 GWEI`}
              </Typography>
              <Typography 
                tag={TYPOGRAPHY.H7} 
                variant={TYPOGRAPHY.H7} 
                color={COLORS.UI4}
              >
                {`12hr: 23-359 GWEI`}
              </Typography>
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
          detailText={`≈ $${maxPriorityFeePerGasFiat}`}
          numeric
          bottomBorder
          inputDetails
        />
      </Box>
    </Popover>
  );
};

AdvancedGasPopover.propTypes = {
  onClose: PropTypes.func,
};

export default AdvancedGasPopover;
