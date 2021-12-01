import React, { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import CheckBox from '../../../ui/check-box';
import I18nValue from '../../../ui/i18n-value';
import {
  COLORS,
  DISPLAY,
  FLEX_DIRECTION,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import { useAdvanceGasFeePopoverContext } from '../context';
import { getIsAdvancedGasFeeDefault } from '../../../../selectors';
import { setAdvancedGasFee } from '../../../../store/actions';

const AdvancedGasFeeDefaults = () => {
  const dispatch = useDispatch();

  const isAdvancedGasFeeDefault = useSelector(getIsAdvancedGasFeeDefault);
  const [defaultValues, setDefaultValues] = useState(isAdvancedGasFeeDefault);

  const { maxBaseFee, maxPriorityFeePerGas } = useAdvanceGasFeePopoverContext();

  const updateDefaultSettings = useCallback(
    (value) => {
      setDefaultValues(value);
      if (value) {
        dispatch(
          setAdvancedGasFee({
            maxBaseFee,
            priorityFee: maxPriorityFeePerGas,
          }),
        );
      } else {
        dispatch(setAdvancedGasFee(null));
      }
    },
    [maxBaseFee, maxPriorityFeePerGas, setDefaultValues, dispatch],
  );

  return (
    <Box
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      margin={4}
    >
      <div className="advanced-gas-fee-defaults__separator" />
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        className="advanced-gas-fee-defaults"
      >
        <CheckBox
          checked={defaultValues}
          className="advanced-gas-fee-defaults__checkbox"
          onClick={() => updateDefaultSettings(!defaultValues)}
        />
        <Typography variant={TYPOGRAPHY.H7} color={COLORS.UI4}>
          {defaultValues ? (
            <I18nValue messageKey="advancedGassFeeDefaultOptOut" />
          ) : (
            <I18nValue messageKey="advancedGassFeeDefaultOptIn" />
          )}
        </Typography>
      </Box>
    </Box>
  );
};

export default AdvancedGasFeeDefaults;
