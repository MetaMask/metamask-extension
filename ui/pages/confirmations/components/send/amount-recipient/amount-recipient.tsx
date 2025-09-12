import React, { useCallback } from 'react';

import {
  Box,
  Button,
  ButtonSize,
} from '../../../../../components/component-library';
import {
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useAmountSelectionMetrics } from '../../../hooks/send/metrics/useAmountSelectionMetrics';
import { useAmountValidation } from '../../../hooks/send/useAmountValidation';
import { useSendActions } from '../../../hooks/send/useSendActions';
import { useSendContext } from '../../../context/send';
import { useRecipientValidation } from '../../../hooks/send/validations/useRecipientValidation';
import { SendHero } from '../../UI/send-hero';
import { Amount } from '../amount/amount';
import { Recipient } from '../recipient';
import { Asset } from '../../../types/send';

export const AmountRecipient = () => {
  const t = useI18nContext();
  const { to, asset } = useSendContext();
  const { handleSubmit } = useSendActions();
  const { captureAmountSelected } = useAmountSelectionMetrics();
  const { amountError } = useAmountValidation();
  const { recipientError } = useRecipientValidation();

  const hasError = Boolean(amountError) || Boolean(recipientError);
  const isDisabled = hasError || !to;

  const onClick = useCallback(() => {
    handleSubmit();
    captureAmountSelected();
  }, [captureAmountSelected, handleSubmit]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      paddingLeft={4}
      paddingRight={4}
      style={{ flex: 1 }}
    >
      <Box>
        <SendHero asset={asset as Asset} />
        <Recipient />
        <Amount />
      </Box>
      <Button
        disabled={isDisabled}
        onClick={onClick}
        size={ButtonSize.Lg}
        backgroundColor={
          hasError ? BackgroundColor.errorDefault : BackgroundColor.iconDefault
        }
        marginBottom={4}
      >
        {amountError ?? t('continue')}
      </Button>
    </Box>
  );
};
