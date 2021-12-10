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
import { getAdvancedGasFeeValues } from '../../../../selectors';
import { setAdvancedGasFee } from '../../../../store/actions';

import { useAdvancedGasFeePopoverContext } from '../context';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const AdvancedGasFeeDefaults = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const {
    hasErrors,
    baseFeeMultiplier,
    maxPriorityFeePerGas,
  } = useAdvancedGasFeePopoverContext();
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
    Boolean(advancedGasFeeValues) &&
    advancedGasFeeValues.maxBaseFee === baseFeeMultiplier &&
    advancedGasFeeValues.priorityFee === maxPriorityFeePerGas;

  const handleUpdateDefaultSettings = () =>
    updateDefaultSettings(!defaultPreference);

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
        onClick={handleUpdateDefaultSettings}
        disabled={hasErrors}
      />
      <Typography variant={TYPOGRAPHY.H7} color={COLORS.UI4} margin={0}>
        {!defaultPreference && Boolean(advancedGasFeeValues) ? (
          <I18nValue
            messageKey="advancedGasFeeDefaultOptIn"
            options={[
              <strong key="default-value-change">{t('newValues')}</strong>,
            ]}
          />
        ) : (
          <I18nValue messageKey="advancedGasFeeDefaultOptOut" />
        )}
      </Typography>
    </Box>
  );
};

export default AdvancedGasFeeDefaults;
