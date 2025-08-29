import { useCallback, useContext } from 'react';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  RecipientInputMethod,
  useSendMetricsContext,
} from '../../../context/send-metrics';
import { useSendContext } from '../../../context/send';
import { useSendType } from '../useSendType';

export const useRecipientSelectionMetrics = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const { asset: { chainId } = {} } = useSendContext();
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
    trackEvent({
      event: MetaMetricsEventName.SendRecipientSelected,
      category: MetaMetricsEventCategory.Send,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: accountType,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        input_method: recipientInputMethod,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: isEvmSendType ? chainId : undefined,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id_caip: isEvmSendType ? undefined : chainId,
      },
    });
  }, [accountType, chainId, isEvmSendType, recipientInputMethod, trackEvent]);

  return {
    captureRecipientSelected,
    setRecipientInputMethodManual,
    setRecipientInputMethodPasted,
    setRecipientInputMethodSelectAccount,
    setRecipientInputMethodSelectContact,
  };
};
