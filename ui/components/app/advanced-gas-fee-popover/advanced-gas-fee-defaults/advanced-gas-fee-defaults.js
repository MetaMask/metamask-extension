import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { useTransactionEventFragment } from '../../../../hooks/useTransactionEventFragment';
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
  const { updateTransactionEventFragment } = useTransactionEventFragment();

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
      updateTransactionEventFragment({
        properties: {
          advanced_gas_defaults_updated_maxbasefee: null,
          advanced_gas_defaults_updated_priorityfee: null,
        },
      });
    } else {
      dispatch(
        setAdvancedGasFee({
          maxBaseFee,
          priorityFee: maxPriorityFeePerGas,
        }),
      );
      updateTransactionEventFragment({
        properties: {
          advanced_gas_defaults_updated_maxbasefee: maxBaseFee,
          advanced_gas_defaults_updated_priorityfee: maxPriorityFeePerGas,
        },
      });
    }
  };

  return (
    <Box
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.ROW}
      marginRight={4}
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
          {!isDefaultSettingsSelected && Boolean(advancedGasFeeValues)
            ? t('advancedGasFeeDefaultOptIn', [
                <strong key="default-value-change">{t('newValues')}</strong>,
              ])
            : t('advancedGasFeeDefaultOptOut')}
        </Typography>
      </label>
    </Box>
  );
};

export default AdvancedGasFeeDefaults;
