import React, { useEffect, useState } from 'react';

import { useGasFeeContext } from '../../../../contexts/gasFee';
import { bnGreaterThan, bnLessThan } from '../../../../helpers/utils/util';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MAX_GAS_LIMIT_DEC } from '../../../../pages/send/send.constants';
import Button from '../../../ui/button';
import FormField from '../../../ui/form-field';
import I18nValue from '../../../ui/i18n-value';
import Typography from '../../../ui/typography';

import { useAdvancedGasFeePopoverContext } from '../context';

const validateGasLimit = (gasLimit, minimumGasLimitDec) => {
  return bnLessThan(gasLimit, minimumGasLimitDec) ||
    bnGreaterThan(gasLimit, MAX_GAS_LIMIT_DEC)
    ? 'editGasLimitOutOfBoundsV2'
    : null;
};

const AdvancedGasFeeGasLimit = () => {
  const t = useI18nContext();
  const {
    setGasLimit: setGasLimitInContext,
  } = useAdvancedGasFeePopoverContext();
  const {
    gasLimit: gasLimitInTransaction,
    minimumGasLimitDec,
  } = useGasFeeContext();
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
  }, [gasLimit, minimumGasLimitDec, setGasLimitInContext]);

  if (isEditing) {
    return (
      <FormField
        error={
          gasLimitError
            ? t(gasLimitError, [minimumGasLimitDec - 1, MAX_GAS_LIMIT_DEC])
            : ''
        }
        onChange={updateGasLimit}
        titleText={t('gasLimitV2')}
        value={gasLimit}
        numeric
      />
    );
  }

  return (
    <Typography
      tag={TYPOGRAPHY.Paragraph}
      variant={TYPOGRAPHY.H7}
      className="advanced-gas-fee-gas-limit"
      margin={[0, 2]}
    >
      <strong>
        <I18nValue messageKey="gasLimitV2" />
      </strong>
      <span>{gasLimit}</span>
      <Button
        className="advanced-gas-fee-gas-limit__edit-link"
        onClick={() => setEditing(true)}
        type="link"
      >
        <I18nValue messageKey="edit" />
      </Button>
    </Typography>
  );
};

export default AdvancedGasFeeGasLimit;
