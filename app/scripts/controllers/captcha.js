import log from 'loglevel';
import { ObservableStore } from '@metamask/obs-store';
import { NOTIFICATION_NAMES } from './permissions/enums';

/**
 * A controller that manage requests for the captcha token
 * Working only for one request per time. Multiple requests are not supported
 * Token will be sent to the latest requested DAPP
 */
export default class CaptchaTokenController {
  /**
   * Creates a new controller instance.
   *
   * @param {CaptchaTokenControllerOptions} [opts] - Controller configuration parameters
   */
  constructor(opts = {}) {
    const initState = { tokenRequestFor: null, ...opts.initState };

    this.store = new ObservableStore(initState);
    this._showUiCaptchaDialog = opts.showUiCaptchaDialog;
    this._notifyDomain = opts.notifyDomain;
  }

  /**
   * Initiate request for the given origin
   *
   * @param {string} origin - The origin to get the capthca token for.
   */
  initiateTokenRequest = (origin) => {
    if (!origin) {
      log.error('Origin not provided or empty');
      // eslint-disable-next-line no-useless-return
      return;
    }

    this._showUiCaptchaDialog();
    this._saveOriginRequest(origin);
  };

  /**
   * Send token back to the DAPP
   *
   * @param {string} token - Token received from the captcha widget
   */
  fulfillTokenToTheOrigin = (token) => {
    const origin = this.store.getState().tokenRequestFor;
    if (!origin || !token) {
      // eslint-disable-next-line no-useless-return
      return null;
    }
    const payload = {
      method: NOTIFICATION_NAMES.captchaTokenReceived,
      params: { token },
    };
    this._notifyDomain(origin, payload);
    this.store.updateState({
      tokenRequestFor: null,
    });

    return origin;
  };

  /**
   * Save token request to the store.
   * Internal method.
   *
   * @param {string} origin - The DAPP origin.
   */
  _saveOriginRequest = (origin) => {
    this.store.updateState({ tokenRequestFor: origin });
  };
}
