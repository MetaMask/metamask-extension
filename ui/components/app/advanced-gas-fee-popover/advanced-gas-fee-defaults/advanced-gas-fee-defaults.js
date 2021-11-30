import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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

import { getIsAdvancedGasFeeDefault } from '../../../../selectors';

const AdvancedGasFeeDefaults = () => {
  const isAdvancedGasFeeDefault = useSelector(getIsAdvancedGasFeeDefault);
  const [defaultValues, setDefaultValues] = useState(isAdvancedGasFeeDefault);
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
          onClick={() => setDefaultValues((checked) => !checked)}
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
