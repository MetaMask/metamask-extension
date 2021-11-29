import React, { useEffect, useState } from 'react';

import { useGasFeeContext } from '../../../../contexts/gasFee';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { GAS_LIMIT } from '../../../../pages/send/send.constants';
import Button from '../../../ui/button';
import FormField from '../../../ui/form-field';
import I18nValue from '../../../ui/i18n-value';
import Typography from '../../../ui/typography';

import { useAdvanceGasFeePopoverContext } from '../context';

const validateGasLimit = (gasLimit) =>
  gasLimit < GAS_LIMIT.MIN || gasLimit > GAS_LIMIT.MAX
    ? 'editGasLimitOutOfBoundsV2'
    : '';

const AdvancedGasFeeGasLimit = () => {
  const t = useI18nContext();
  const {
    setDirty,
    setGasLimit: setGasLimitInContext,
    setHasError,
  } = useAdvanceGasFeePopoverContext();
  const { gasLimit: gasLimitInTransaction } = useGasFeeContext();
  const [isEditing, setEditing] = useState(false);
  const [gasLimit, setGasLimit] = useState(gasLimitInTransaction);
  const [gasLimitError, setGasLimitError] = useState();

  const updateGasLimit = (value) => {
    setGasLimit(value);
    setDirty(true);
  };

  useEffect(() => {
    setGasLimitInContext(gasLimit);
    const error = validateGasLimit(gasLimit);
    setGasLimitError(error);
    setHasError(Boolean(error));
  }, [gasLimit, setGasLimitInContext, setHasError]);

  if (isEditing) {
    return (
      <FormField
        error={
          gasLimitError ? t(gasLimitError, [GAS_LIMIT.MIN, GAS_LIMIT.MAX]) : ''
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
