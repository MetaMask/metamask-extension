import React, { useEffect, useState } from 'react';

import { useGasFeeContext } from '../../../../../contexts/gasFee';
import { bnGreaterThan, bnLessThan } from '../../../../../helpers/utils/util';
import { TextVariant } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { MAX_GAS_LIMIT_DEC } from '../../../send/send.constants';
import Button from '../../../../../components/ui/button';
import FormField from '../../../../../components/ui/form-field';

import { useAdvancedGasFeePopoverContext } from '../context';
import { Text } from '../../../../../components/component-library';
import { IGNORE_GAS_LIMIT_CHAIN_IDS } from '../../../constants';
import { hexToDecimal } from '../../../../../../shared/modules/conversion.utils';

const validateGasLimit = (gasLimit, minGasLimit, maxGasLimit) =>
  bnLessThan(gasLimit, minGasLimit) || bnGreaterThan(gasLimit, maxGasLimit)
    ? 'editGasLimitOutOfBoundsV2'
    : null;

const AdvancedGasFeeGasLimit = () => {
  const t = useI18nContext();
  const { setGasLimit: setGasLimitInContext, setErrorValue } =
    useAdvancedGasFeePopoverContext();
  const {
    gasLimit: gasLimitInTransaction,
    minimumGasLimitDec,
    transaction: { chainId, originalGasEstimate },
  } = useGasFeeContext();
  const originalGasEstimateDec =
    originalGasEstimate !== undefined && hexToDecimal(originalGasEstimate);
  const [maxGasLimit, setMaxGasLimit] = useState(
    originalGasEstimateDec
      ? Math.max(MAX_GAS_LIMIT_DEC, originalGasEstimateDec)
      : MAX_GAS_LIMIT_DEC,
  );
  const [isEditing, setEditing] = useState(false);
  const [gasLimit, setGasLimit] = useState(gasLimitInTransaction);
  const [gasLimitError, setGasLimitError] = useState();

  const updateGasLimit = (value) => {
    setGasLimit(value);
  };

  useEffect(() => {
    setGasLimitInContext(gasLimit);
    if (IGNORE_GAS_LIMIT_CHAIN_IDS.includes(chainId)) {
      return;
    }
    const error = validateGasLimit(gasLimit, minimumGasLimitDec, maxGasLimit);
    setGasLimitError(error);
    setEditing(isEditing === true ? isEditing : error !== null);
    setErrorValue('gasLimit', error === 'editGasLimitOutOfBoundsV2');
  }, [
    chainId,
    gasLimit,
    minimumGasLimitDec,
    setGasLimitInContext,
    setErrorValue,
    maxGasLimit,
    isEditing,
    t,
  ]);

  useEffect(() => {
    if (originalGasEstimateDec) {
      setMaxGasLimit(Math.max(MAX_GAS_LIMIT_DEC, originalGasEstimateDec));
    }
  }, [minimumGasLimitDec, originalGasEstimateDec, setMaxGasLimit]);

  if (isEditing) {
    return (
      <FormField
        dataTestId="gas-limit-input"
        error={
          gasLimitError
            ? t(gasLimitError, [minimumGasLimitDec - 1, maxGasLimit])
            : ''
        }
        onChange={updateGasLimit}
        titleText={t('gasLimitV2')}
        value={gasLimit}
        allowDecimals={false}
        numeric
      />
    );
  }

  return (
    <Text
      tag={TextVariant.bodyMd}
      variant={TextVariant.bodySm}
      as="h6"
      className="advanced-gas-fee-gas-limit"
      marginTop={4}
      marginLeft={2}
      marginRight={2}
    >
      <strong>{t('gasLimitV2')}</strong>
      <span>{gasLimit}</span>
      <Button
        data-testid="advanced-gas-fee-edit"
        className="advanced-gas-fee-gas-limit__edit-link"
        onClick={() => setEditing(true)}
        type="link"
      >
        {t('edit')}
      </Button>
    </Text>
  );
};

export default AdvancedGasFeeGasLimit;
