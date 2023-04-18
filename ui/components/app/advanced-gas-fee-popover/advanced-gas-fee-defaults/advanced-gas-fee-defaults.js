import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { useTransactionEventFragment } from '../../../../hooks/useTransactionEventFragment';
import { EditGasModes } from '../../../../../shared/constants/gas';
import Box from '../../../ui/box';
import CheckBox from '../../../ui/check-box';
import {
  DISPLAY,
  FLEX_DIRECTION,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { getAdvancedGasFeeValues } from '../../../../selectors';
import { setAdvancedGasFee } from '../../../../store/actions';
import { useGasFeeContext } from '../../../../contexts/gasFee';

import { useAdvancedGasFeePopoverContext } from '../context';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Text } from '../../../component-library';

const AdvancedGasFeeDefaults = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { gasErrors, maxBaseFee, maxPriorityFeePerGas } =
    useAdvancedGasFeePopoverContext();
  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);
  const { updateTransactionEventFragment } = useTransactionEventFragment();
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

  if (editGasMode === EditGasModes.swaps) {
    return null;
  }

  return (
    <Box
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.ROW}
      marginTop={4}
      marginLeft={2}
      marginRight={2}
      className="advanced-gas-fee-defaults"
    >
      <label className="advanced-gas-fee-defaults__label">
        <CheckBox
          checked={isDefaultSettingsSelected}
          className="advanced-gas-fee-defaults__checkbox"
          onClick={handleUpdateDefaultSettings}
          disabled={gasErrors.maxFeePerGas || gasErrors.maxPriorityFeePerGas}
        />
        <Text
          variant={TextVariant.bodySm} as="h6"
          color={TextColor.textAlternative}
          margin={0}
        >
          {isDefaultSettingsSelected
            ? t('advancedGasFeeDefaultOptOut')
            : t('advancedGasFeeDefaultOptIn', [
                <strong key="default-value-change">{t('newValues')}</strong>,
              ])}
        </Text>
      </label>
    </Box>
  );
};

export default AdvancedGasFeeDefaults;
