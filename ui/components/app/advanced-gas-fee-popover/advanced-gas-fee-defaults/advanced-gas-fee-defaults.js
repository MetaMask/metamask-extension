import React from 'react';
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
import {
  getIsAdvancedGasFeeDefault,
  getAdvancedGasFeeValues,
} from '../../../../selectors';
import { setAdvancedGasFee } from '../../../../store/actions';

import { useAdvanceGasFeePopoverContext } from '../context';

const AdvancedGasFeeDefaults = () => {
  const dispatch = useDispatch();

  const {
    baseFeeMultiplier,
    maxPriorityFeePerGas,
  } = useAdvanceGasFeePopoverContext();
  const isAdvancedGasFeeDefault = useSelector(getIsAdvancedGasFeeDefault);
  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);

  const updateDefaultSettings = (value) => {
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
  };
  const defaultPreference =
    isAdvancedGasFeeDefault &&
    advancedGasFeeValues.maxBaseFee === baseFeeMultiplier &&
    advancedGasFeeValues.priorityFee === maxPriorityFeePerGas;

  return (
    <Box
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.ROW}
      marginRight={4}
      className="advanced-gas-fee-defaults"
    >
      <CheckBox
        checked={defaultPreference}
        className="advanced-gas-fee-defaults__checkbox"
        onClick={() => updateDefaultSettings(!defaultPreference)}
      />
      <Typography variant={TYPOGRAPHY.H7} color={COLORS.UI4}>
        <I18nValue
          messageKey={
            defaultPreference
              ? 'advancedGasFeeDefaultOptOut'
              : 'advancedGasFeeDefaultOptIn'
          }
        />
      </Typography>
    </Box>
  );
};

export default AdvancedGasFeeDefaults;
