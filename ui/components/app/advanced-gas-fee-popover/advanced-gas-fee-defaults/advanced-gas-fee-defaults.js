import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { EDIT_GAS_MODES } from '../../../../../shared/constants/gas';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import CheckBox from '../../../ui/check-box';
import {
  COLORS,
  DISPLAY,
  FLEX_DIRECTION,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import { getAdvancedGasFeeValues } from '../../../../selectors';
import { setAdvancedGasFee } from '../../../../store/actions';
import { useGasFeeContext } from '../../../../contexts/gasFee';

import { useAdvancedGasFeePopoverContext } from '../context';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const AdvancedGasFeeDefaults = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const {
    hasErrors,
    maxBaseFee,
    maxPriorityFeePerGas,
  } = useAdvancedGasFeePopoverContext();
  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);
  const { editGasMode } = useGasFeeContext();

  const [isDefaultSettingsSelected, setDefaultSettingsSelected] = useState(
    Boolean(advancedGasFeeValues) &&
      advancedGasFeeValues.maxBaseFee === maxBaseFee &&
      advancedGasFeeValues.priorityFee === maxPriorityFeePerGas,
  );

  useEffect(() => {
    setDefaultSettingsSelected(
      Boolean(advancedGasFeeValues) &&
        advancedGasFeeValues.maxBaseFee === maxBaseFee &&
        advancedGasFeeValues.priorityFee === maxPriorityFeePerGas,
    );
  }, [advancedGasFeeValues, maxBaseFee, maxPriorityFeePerGas]);

  const handleUpdateDefaultSettings = () => {
    if (isDefaultSettingsSelected) {
      dispatch(setAdvancedGasFee(null));
      setDefaultSettingsSelected(false);
    } else {
      dispatch(
        setAdvancedGasFee({
          maxBaseFee,
          priorityFee: maxPriorityFeePerGas,
        }),
      );
      setDefaultSettingsSelected(true);
    }
  };

  if (editGasMode === EDIT_GAS_MODES.SWAPS) {
    return null;
  }

  return (
    <Box
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.ROW}
      margin={[4, 2, 0, 2]}
      className="advanced-gas-fee-defaults"
    >
      <label className="advanced-gas-fee-defaults__label">
        <CheckBox
          checked={isDefaultSettingsSelected}
          className="advanced-gas-fee-defaults__checkbox"
          onClick={handleUpdateDefaultSettings}
          disabled={hasErrors}
        />
        <Typography variant={TYPOGRAPHY.H7} color={COLORS.UI4} margin={0}>
          {isDefaultSettingsSelected
            ? t('advancedGasFeeDefaultOptOut')
            : t('advancedGasFeeDefaultOptIn', [
                <strong key="default-value-change">{t('newValues')}</strong>,
              ])}
        </Typography>
      </label>
    </Box>
  );
};

export default AdvancedGasFeeDefaults;
