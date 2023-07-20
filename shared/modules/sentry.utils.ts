import { Client, ClientOptions, Hub } from '@sentry/types';

/**
 * There is an undocumented and untyped method of the browser sdk that allows
 * accessing the current "Hub" which is a documented and typed property of the
 * SDK instance. This extended client bridges the gap of the untyped method. It
 * is listed as an optionally defined value to prevent breaking the application
 * if it is not accessible.
 */
interface ExtendedClient extends Client {
  getCurrentHub?: () => Hub;
}

/**
 * This method toggles the state of the Sentry client based on the user's
 * MetaMetrics optin status. It relies upon currently undocumented methods that
 * may not be available on future versions of the SDK. Optional chaining is
 * used heavily with fallbacks so that if the API is removed the application
 * will still function. If sentry stops receiving reports for a specific
 * version of the extension it is likely that we updated the SDK and the API
 * was removed.
 *
 * @param sentry - Instance of Sentry browser client
 * @param participateInMetaMetrics - user MetaMetrics optin status
 */
export function toggleSentryMonitoring(
  sentry: ExtendedClient,
  participateInMetaMetrics: boolean | null = false,
) {
  console.log('inside toggle sentry', sentry, participateInMetaMetrics);
  // If sentry is not available, which may be the case in some scenarios where
  // the attachment to global/window is not fulfilled, return early and do
  // nothing.
  if (!sentry) {
    return;
  }
  // The "hub" gets created when calling Sentry.init, and is a central point
  // where configuration options, client connections, breadcrumbs and more are
  // stored. We need to have access to this hub to then be able to get the
  // current connected client and its options.
  const hub = sentry.getCurrentHub?.();
  const options: ClientOptions =
    hub?.getClient?.()?.getOptions?.() ?? ({} as ClientOptions);

  // In the below code we will set options.enabled based on the
  // participateInMetaMetrics flag. Options will be a plain js object in the
  // case that the chain above doesn't result in an object being returned see
  // the `?? ({} as ClientOptions)` portion of line 42 above. If that is the
  // case the setting of options.enabled will be ineffectual. In addition we
  // use optional chaining of the method call to either startSession or
  // endSession in the event that we did not get a reference to the Hub. We
  // also check for the current value of the enabled flag to see if we need to
  // start or end a session.
  if (participateInMetaMetrics === true && options.enabled === false) {
    options.enabled = true;
    // Initiate session
    hub?.startSession?.();
  } else if (participateInMetaMetrics === false && options.enabled === true) {
    hub?.endSession?.();
    options.enabled = false;
  }
}
