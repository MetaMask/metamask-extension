import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { capitalize } from 'lodash';
import { useTransactionEventFragment } from '../../../../hooks/useTransactionEventFragment';
import { EditGasModes } from '../../../../../shared/constants/gas';
import Box from '../../../ui/box';
import CheckBox from '../../../ui/check-box';
import {
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  getAdvancedGasFeeValues,
  getCurrentChainId,
  getNetworkIdentifier,
} from '../../../../selectors';
import { setAdvancedGasFee } from '../../../../store/actions';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useAdvancedGasFeePopoverContext } from '../context';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Text } from '../../../component-library/text/deprecated';

const AdvancedGasFeeDefaults = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { gasErrors, maxBaseFee, maxPriorityFeePerGas } =
    useAdvancedGasFeePopoverContext();
  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);
  // This will need to use a different chainId in multinetwork
  const chainId = useSelector(getCurrentChainId);
  const networkIdentifier = useSelector(getNetworkIdentifier);
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
      dispatch(setAdvancedGasFee({ chainId, gasFeePreferences: undefined }));
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
          chainId,
          gasFeePreferences: {
            maxBaseFee,
            priorityFee: maxPriorityFeePerGas,
          },
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
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
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
          variant={TextVariant.bodySm}
          as="h6"
          color={TextColor.textAlternative}
        >
          {t('advancedGasFeeDefaultOptIn', [capitalize(networkIdentifier)])}
        </Text>
      </label>
    </Box>
  );
};

export default AdvancedGasFeeDefaults;
