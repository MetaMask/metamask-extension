import { useCallback } from 'react';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../../hooks/useAnalytics';
import { useSendContext } from '../../../context/send';
import {
  AmountInputMethod,
  AmountInputType,
  useSendMetricsContext,
} from '../../../context/send-metrics';
import { useSendType } from '../useSendType';

export const useAmountSelectionMetrics = () => {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { chainId } = useSendContext();
  const { isEvmSendType } = useSendType();
  const {
    accountType,
    amountInputMethod,
    amountInputType,
    setAmountInputMethod,
    setAmountInputType,
  } = useSendMetricsContext();

  const setAmountInputMethodManual = useCallback(() => {
    setAmountInputMethod(AmountInputMethod.Manual);
  }, [setAmountInputMethod]);

  const setAmountInputMethodPasted = useCallback(() => {
    setAmountInputMethod(AmountInputMethod.Pasted);
  }, [setAmountInputMethod]);

  const setAmountInputMethodPressedMax = useCallback(() => {
    setAmountInputMethod(AmountInputMethod.PressedMax);
  }, [setAmountInputMethod]);

  const setAmountInputTypeFiat = useCallback(() => {
    setAmountInputType(AmountInputType.Fiat);
  }, [setAmountInputType]);

  const setAmountInputTypeToken = useCallback(() => {
    setAmountInputType(AmountInputType.Token);
  }, [setAmountInputType]);

  const captureAmountSelected = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.SendAmountSelected)
        .addCategory(MetaMetricsEventCategory.Send)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: accountType,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          input_method: amountInputMethod,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          input_type: amountInputType,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: isEvmSendType ? chainId : undefined,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id_caip: isEvmSendType ? undefined : chainId,
        })
        .build({ excludeMetaMetricsId: false }),
    );
  }, [
    accountType,
    amountInputMethod,
    amountInputType,
    chainId,
    createEventBuilder,
    isEvmSendType,
    trackEvent,
  ]);

  return {
    captureAmountSelected,
    setAmountInputMethodManual,
    setAmountInputMethodPasted,
    setAmountInputMethodPressedMax,
    setAmountInputTypeFiat,
    setAmountInputTypeToken,
  };
};
