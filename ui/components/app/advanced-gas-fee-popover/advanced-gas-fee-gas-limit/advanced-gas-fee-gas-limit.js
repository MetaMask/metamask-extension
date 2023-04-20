import React, { useEffect, useState } from 'react';

import { useGasFeeContext } from '../../../../contexts/gasFee';
import { bnGreaterThan, bnLessThan } from '../../../../helpers/utils/util';
import { TextVariant } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MAX_GAS_LIMIT_DEC } from '../../../../pages/send/send.constants';
import Button from '../../../ui/button';
import FormField from '../../../ui/form-field';

import { useAdvancedGasFeePopoverContext } from '../context';
import { Text } from '../../../component-library';

const validateGasLimit = (gasLimit, minimumGasLimitDec) => {
  return bnLessThan(gasLimit, minimumGasLimitDec) ||
    bnGreaterThan(gasLimit, MAX_GAS_LIMIT_DEC)
    ? 'editGasLimitOutOfBoundsV2'
    : null;
};

const AdvancedGasFeeGasLimit = () => {
  const t = useI18nContext();
  const { setGasLimit: setGasLimitInContext, setErrorValue } =
    useAdvancedGasFeePopoverContext();
  const { gasLimit: gasLimitInTransaction, minimumGasLimitDec } =
    useGasFeeContext();
  const [isEditing, setEditing] = useState(false);
  const [gasLimit, setGasLimit] = useState(gasLimitInTransaction);
  const [gasLimitError, setGasLimitError] = useState();

  const updateGasLimit = (value) => {
    setGasLimit(value);
  };

  useEffect(() => {
    setGasLimitInContext(gasLimit);
    const error = validateGasLimit(gasLimit, minimumGasLimitDec);
    setGasLimitError(error);
    setErrorValue('gasLimit', error === 'editGasLimitOutOfBoundsV2');
  }, [gasLimit, minimumGasLimitDec, setGasLimitInContext, setErrorValue]);

  if (isEditing) {
    return (
      <FormField
        dataTestId="gas-limit-input"
        error={
          gasLimitError
            ? t(gasLimitError, [minimumGasLimitDec - 1, MAX_GAS_LIMIT_DEC])
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
