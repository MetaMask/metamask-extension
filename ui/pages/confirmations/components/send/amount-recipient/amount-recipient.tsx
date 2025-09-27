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
import { SendHero } from '../../UI/send-hero';
import { Amount } from '../amount/amount';
import { Recipient } from '../recipient';
import { HexData } from '../hex-data';

export const AmountRecipient = () => {
  const t = useI18nContext();
  const [amountValueError, setAmountValueError] = useState<string>();
  const [hexDataError, setHexDataError] = useState<string>();
  const { asset, toResolved } = useSendContext();
  const { handleSubmit } = useSendActions();
  const { captureAmountSelected } = useAmountSelectionMetrics();
  const { recipientError } = useRecipientValidation();

  const hasError =
    Boolean(amountValueError) ||
    Boolean(recipientError) ||
    Boolean(hexDataError);
  const isDisabled = hasError || !toResolved;

  const onClick = useCallback(() => {
    handleSubmit();
    captureAmountSelected();
  }, [captureAmountSelected, handleSubmit]);

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
      style={{ flex: 1 }}
    >
      <Box>
        <SendHero asset={asset as Asset} />
        <Recipient />
        <Amount setAmountValueError={setAmountValueError} />
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
        {amountValueError ?? hexDataError ?? t('continue')}
      </Button>
    </Box>
  );
};
