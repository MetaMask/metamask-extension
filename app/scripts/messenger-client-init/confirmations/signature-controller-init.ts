import { SignatureController } from '@metamask/signature-controller';
import { ControllerInitFunction } from '../types';
import {
  SignatureControllerInitMessenger,
  SignatureControllerMessenger,
} from '../messengers';
import { trace } from '../../../../shared/lib/trace';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';

/**
 * Initialize the signature controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger
 * @returns The initialized controller.
 */
export const SignatureControllerInit: ControllerInitFunction<
  SignatureController,
  SignatureControllerMessenger,
  SignatureControllerInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const controller = new SignatureController({
    messenger: controllerMessenger,
    decodingApiUrl: process.env.DECODING_API_URL,
    isDecodeSignatureRequestEnabled: () => {
      const state = initMessenger.call('PreferencesController:getState');
      return state.useTransactionSimulations;
    },

    // @ts-expect-error: Types of `TraceRequest` are not the same.
    trace,
  });

  controller.hub.on('cancelWithReason', ({ metadata: message, reason }) => {
    initMessenger.call('MetaMetricsController:trackEvent', {
      event: reason,
      category: MetaMetricsEventCategory.Transactions,
      properties: {
        action: 'Sign Request',
        type: message.type,
      },
    });
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller,
  };
};
