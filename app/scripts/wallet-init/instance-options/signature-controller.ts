import type { WalletOptions } from '@metamask/wallet';
import type { SignatureController } from '@metamask/signature-controller';
import { trace } from '../../../../shared/lib/trace';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';
import type { SignatureControllerInitMessenger } from '../messengers/signature-controller-messenger';

type SignatureControllerInstanceOptions = NonNullable<
  NonNullable<WalletOptions['instanceOptions']>['signatureController']
>;

type GetSignatureControllerInstanceOptionsRequest = {
  initMessenger: SignatureControllerInitMessenger;
};

/**
 * Build the extension's client-specific options for the wallet-owned
 * `SignatureController`.
 *
 * @param request - The request object.
 * @param request.initMessenger - Messenger used to read preferences.
 * @returns The signature controller instance options.
 */
export function getSignatureControllerInstanceOptions({
  initMessenger,
}: GetSignatureControllerInstanceOptionsRequest): SignatureControllerInstanceOptions {
  return {
    decodingApiUrl: process.env.DECODING_API_URL,
    isDecodeSignatureRequestEnabled: () => {
      const state = initMessenger.call('PreferencesController:getState');
      return state.useTransactionSimulations;
    },
    // @ts-expect-error: Types of `TraceRequest` are not the same.
    trace,
  };
}

/**
 * Track sign request cancellations through the AnalyticsController.
 *
 * @param signatureController - The wallet-owned signature controller.
 */
export function setupSignatureControllerListeners(
  signatureController: SignatureController,
) {
  signatureController.hub.on(
    'cancelWithReason',
    ({ metadata: message, reason }) => {
      trackEvent(
        createEventBuilder(reason)
          .addCategory(MetaMetricsEventCategory.Transactions)
          .addProperties({
            action: 'Sign Request',
            type: message.type,
          })
          .build(),
      );
    },
  );
}
