import { useCallback, useContext } from 'react';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import { useSendContext } from '../../../context/send';
import {
  AmountInputMethod,
  AmountInputType,
  useSendMetricsContext,
} from '../../../context/send-metrics';
import { useSendType } from '../useSendType';

export const useAmountSelectionMetrics = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const { asset: { chainId } = {} } = useSendContext();
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
    trackEvent({
      event: MetaMetricsEventName.SendAmountSelected,
      category: MetaMetricsEventCategory.Send,
      properties: {
        account_type: accountType,
        input_method: amountInputMethod,
        input_type: amountInputType,
        chain_id: isEvmSendType ? chainId : undefined,
        chain_id_caip: isEvmSendType ? undefined : chainId,
      },
    });
  }, [
    accountType,
    amountInputMethod,
    amountInputType,
    chainId,
    isEvmSendType,
    trackEvent,
  ]);

  return {
    captureAmountSelected,
    setAmountInputMethodManual,
    setAmountInputMethodPressedMax,
    setAmountInputTypeFiat,
    setAmountInputTypeToken,
  };
};
