/* eslint-disable @typescript-eslint/naming-convention */
import { useCallback } from 'react';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../../hooks/useAnalytics';
import {
  RecipientInputMethod,
  useSendMetricsContext,
} from '../../../context/send-metrics';
import { useSendContext } from '../../../context/send';
import { useSendType } from '../useSendType';

export const useRecipientSelectionMetrics = () => {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { chainId } = useSendContext();
  const { isEvmSendType } = useSendType();
  const { accountType, recipientInputMethod, setRecipientInputMethod } =
    useSendMetricsContext();

  const setRecipientInputMethodManual = useCallback(() => {
    setRecipientInputMethod(RecipientInputMethod.Manual);
  }, [setRecipientInputMethod]);

  const setRecipientInputMethodPasted = useCallback(() => {
    setRecipientInputMethod(RecipientInputMethod.Pasted);
  }, [setRecipientInputMethod]);

  const setRecipientInputMethodSelectAccount = useCallback(() => {
    setRecipientInputMethod(RecipientInputMethod.SelectAccount);
  }, [setRecipientInputMethod]);

  const setRecipientInputMethodSelectContact = useCallback(() => {
    setRecipientInputMethod(RecipientInputMethod.SelectContact);
  }, [setRecipientInputMethod]);

  const captureRecipientSelected = useCallback(async () => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.SendRecipientSelected)
        .addCategory(MetaMetricsEventCategory.Send)
        .addProperties({
          account_type: accountType,
          input_method: recipientInputMethod,
          chain_id: chainId,
          chain_id_caip: isEvmSendType
            ? `eip155:${parseInt(chainId as string, 16)}`
            : chainId,
        })
        .build({ excludeMetaMetricsId: false }),
    );
  }, [
    accountType,
    chainId,
    createEventBuilder,
    isEvmSendType,
    recipientInputMethod,
    trackEvent,
  ]);

  return {
    captureRecipientSelected,
    setRecipientInputMethodManual,
    setRecipientInputMethodPasted,
    setRecipientInputMethodSelectAccount,
    setRecipientInputMethodSelectContact,
  };
};
