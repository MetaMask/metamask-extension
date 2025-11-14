import React, { useCallback, useState } from 'react';

import LoadingScreen from '../../../../../components/ui/loading-screen';
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
import { Asset } from '../../../types/send';
import { useAmountSelectionMetrics } from '../../../hooks/send/metrics/useAmountSelectionMetrics';
import { useSendActions } from '../../../hooks/send/useSendActions';
import { useSendContext } from '../../../context/send';
import { useRecipientValidation } from '../../../hooks/send/useRecipientValidation';
import { useRecipientSelectionMetrics } from '../../../hooks/send/metrics/useRecipientSelectionMetrics';
import { useAmountValidation } from '../../../hooks/send/useAmountValidation';
import { useSendType } from '../../../hooks/send/useSendType';
import { SendHero } from '../../UI/send-hero';
import { Amount } from '../amount/amount';
import { Recipient } from '../recipient';
import { HexData } from '../hex-data';

export const AmountRecipient = () => {
  const t = useI18nContext();
  const [hexDataError, setHexDataError] = useState<string>();
  const { asset, toResolved } = useSendContext();
  const { amountError, validateNonEvmAmountAsync } = useAmountValidation();
  const { isNonEvmSendType } = useSendType();
  const { handleSubmit } = useSendActions();
  const { captureAmountSelected } = useAmountSelectionMetrics();
  const { captureRecipientSelected } = useRecipientSelectionMetrics();
  const recipientValidationResult = useRecipientValidation();

  const hasError =
    Boolean(amountError) ||
    Boolean(recipientValidationResult.recipientError) ||
    Boolean(hexDataError);
  const isDisabled = hasError || !toResolved;

  const onClick = useCallback(async () => {
    if (isNonEvmSendType) {
      // Non EVM flows need an extra validation because "value" can be empty dependent on the blockchain (e.g it's fine for Solana but not for Bitcoin)
      // Hence we do a call for `validateNonEvmAmountAsync` here to raise UI validation errors if exists
      const nonEvmAmountError = await validateNonEvmAmountAsync();
      if (nonEvmAmountError) {
        return;
      }
    }
    handleSubmit();
    captureAmountSelected();
    captureRecipientSelected();
  }, [
    captureAmountSelected,
    captureRecipientSelected,
    handleSubmit,
    isNonEvmSendType,
    validateNonEvmAmountAsync,
  ]);

  if (!asset) {
    return <LoadingScreen />;
  }

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      paddingLeft={4}
      paddingRight={4}
      style={{ flex: 1, height: '100%' }}
    >
      <Box>
        <SendHero asset={asset as Asset} />
        <Recipient recipientValidationResult={recipientValidationResult} />
        <Amount amountError={amountError} />
        <HexData setHexDataError={setHexDataError} />
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
        {amountError ?? hexDataError ?? t('continue')}
      </Button>
    </Box>
  );
};
