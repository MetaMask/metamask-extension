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
import {
  getIsAdvancedGasFeeDefault,
  getAdvancedGasFeeValues,
} from '../../../../selectors';
import { setAdvancedGasFee } from '../../../../store/actions';

const AdvancedGasFeeDefaults = () => {
  const dispatch = useDispatch();

  const {
    baseFeeMultiplier,
    maxPriorityFeePerGas,
  } = useAdvanceGasFeePopoverContext();
  const isAdvancedGasFeeDefault = useSelector(getIsAdvancedGasFeeDefault);
  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);
  console.log(
    isAdvancedGasFeeDefault,
    advancedGasFeeValues,
    baseFeeMultiplier,
    maxPriorityFeePerGas,
  );
  const [defaultValues, setDefaultValues] = useState(isAdvancedGasFeeDefault);

  const updateDefaultSettings = useCallback(
    (value) => {
      setDefaultValues(value);
      if (value) {
        dispatch(
          setAdvancedGasFee({
            maxBaseFee: baseFeeMultiplier,
            priorityFee: maxPriorityFeePerGas,
          }),
        );
      } else {
        dispatch(setAdvancedGasFee(null));
      }
    },
    [baseFeeMultiplier, maxPriorityFeePerGas, setDefaultValues, dispatch],
  );

  return (
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
  );
};

export default AdvancedGasFeeDefaults;
