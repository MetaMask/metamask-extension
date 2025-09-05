import React, { useCallback, useState } from 'react';

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
import { Amount } from '../amount/amount';
import { Header } from '../header';
import { Recipient } from '../recipient';

export const AmountRecipient = () => {
  const t = useI18nContext();
  const [to, setTo] = useState<string | undefined>();
  const { handleSubmit } = useSendActions();
  const { captureAmountSelected } = useAmountSelectionMetrics();
  const { amountError } = useAmountValidation();

  const onClick = useCallback(() => {
    handleSubmit(to);
    captureAmountSelected();
  }, [captureAmountSelected, handleSubmit, to]);

  const hasAmountError = Boolean(amountError);

  return (
    <div className="send__wrapper">
      <div className="send__container">
        <div className="send__content">
          <Header />
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.spaceBetween}
            className="send__body"
            padding={4}
          >
            <Box>
              <Recipient setTo={setTo} />
              <Amount />
            </Box>
            <Button
              disabled={hasAmountError}
              onClick={onClick}
              size={ButtonSize.Lg}
              backgroundColor={
                hasAmountError
                  ? BackgroundColor.errorDefault
                  : BackgroundColor.iconDefault
              }
            >
              {amountError ?? t('continue')}
            </Button>
          </Box>
        </div>
      </div>
    </div>
  );
};
