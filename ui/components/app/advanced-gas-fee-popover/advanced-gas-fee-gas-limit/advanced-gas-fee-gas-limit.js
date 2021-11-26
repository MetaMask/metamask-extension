import React, { useEffect, useState } from 'react';

import { useGasFeeContext } from '../../../../contexts/gasFee';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Box from '../../../ui/box';
import Button from '../../../ui/button';
import FormField from '../../../ui/form-field';
import I18nValue from '../../../ui/i18n-value';
import Typography from '../../../ui/typography';

import { useAdvanceGasFeePopoverContext } from '../context';

const AdvancedGasFeeGasLimit = () => {
  const t = useI18nContext();
  const {
    setDirty,
    setGasLimit: setGasLimitInContext,
  } = useAdvanceGasFeePopoverContext();
  const { gasLimit: gasLimitInTransaction } = useGasFeeContext();
  const [isEditing, setEditing] = useState(false);
  const [gasLimit, setGasLimit] = useState(gasLimitInTransaction);

  const updateGasLimit = (value) => {
    setGasLimit(value);
    setDirty(true);
  };

  useEffect(() => {
    setGasLimitInContext(gasLimit);
  }, [gasLimit, setGasLimitInContext]);

  if (isEditing) {
    return (
      <FormField
        onChange={updateGasLimit}
        titleText={t('gasLimitV2')}
        value={gasLimit}
        numeric
      />
    );
  }

  return (
    <Typography tag={TYPOGRAPHY.Paragraph} variant={TYPOGRAPHY.H7}>
      <Box
        display="flex"
        alignItems="center"
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
      </Box>
    </Typography>
  );
};

export default AdvancedGasFeeGasLimit;
