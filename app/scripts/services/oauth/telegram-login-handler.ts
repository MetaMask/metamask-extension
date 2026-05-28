import {
  Env as ProfileSyncEnv,
  Platform,
  getEnvUrls,
  getOidcClientId,
} from '@metamask/profile-sync-controller/sdk';
import { AuthConnection } from '../../../../shared/constants/onboarding';
import { BaseLoginHandler } from './base-login-handler';
import { AuthTokenResponse, LoginHandlerOptions, OAuthUserInfo } from './types';
import { decodeIdToken } from './utils';

export type TelegramLoginHandlerOptions = LoginHandlerOptions & {
  profileSyncEnv: ProfileSyncEnv;
};

/**
 * TelegramLoginHandler implements the Telegram social login flow
 */
export class TelegramLoginHandler extends BaseLoginHandler {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly OAUTH_SERVER_INITIATE_PATH = '/api/v2/telegram/login/initiate';

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly OAUTH_SERVER_VERIFY_PATH = '/api/v2/telegram/login/verify';

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly OAUTH_SERVER_MINT_PATH = '/api/v1/oauth/mint';

  readonly #scope = ['openid'];

  #options: TelegramLoginHandlerOptions;

  #state: string | undefined;

  constructor(options: TelegramLoginHandlerOptions) {
    super(options);
    this.#options = options;
  }

  #getProfileSyncUrls() {
    return getEnvUrls(this.#options.profileSyncEnv);
  }

  #getProfileSyncAuthApiUrl(): string {
    return this.#getProfileSyncUrls().authApiUrl;
  }

  #getProfileAliasesClaimKey(): string {
    return `${this.#getProfileSyncAuthApiUrl()}/profile/aliases`;
  }

  async #exchangeJwtBearerForOidcAccessToken(
    jwtToken: string,
  ): Promise<string> {
    const { profileSyncEnv } = this.#options;
    const { oidcApiUrl } = this.#getProfileSyncUrls();
    const oidcTokenUrl = `${oidcApiUrl}/oauth2/token`;

    const body = new URLSearchParams();
    body.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    body.set('client_id', getOidcClientId(profileSyncEnv, Platform.EXTENSION));
    body.set('assertion', jwtToken);

    const response = await fetch(oidcTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(
        `OIDC exchange failed: ${response.status} ${response.statusText}`,
      );
    }

    const responseData = await response.json();
    return responseData.access_token;
  }

  get authConnection() {
    return AuthConnection.Telegram;
  }

  get scope() {
    return this.#scope;
  }

  /**
   * Build the backend initiate URL for the Telegram login flow.
   *
   * @returns The URL to initiate the OAuth login.
   */
  async getAuthUrl(): Promise<string> {
    const { challenge } = await this.generateCodeVerifierChallenge();
    this.#state = this.generateNonce();
    const appRedirectUri = this.options.webAuthenticator.getRedirectURL();

    const initiateUrl = new URL(
      `${this.#getProfileSyncAuthApiUrl()}${this.OAUTH_SERVER_INITIATE_PATH}`,
    );
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    initiateUrl.searchParams.set('code_challenge', challenge);
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    initiateUrl.searchParams.set('app_redirect_uri', appRedirectUri);
    initiateUrl.searchParams.set('state', this.#state);

    return initiateUrl.toString();
  }

  /**
   * Validate the state value from the OAuth login redirect URL.
   *
   * @param url - The OAuth login redirect URL.
   */
  validateState(url: string): void {
    const urlObj = new URL(url);
    const state = urlObj.searchParams.get('state');
    if (state !== this.#state) {
      throw new Error('Invalid oauth state for telegram login');
    }
  }

  generateAuthTokenRequestData(): string {
    throw new Error(
      'TelegramLoginHandler does not use generateAuthTokenRequestData',
    );
  }

  /**
   * Execute the server-side token exchange chain:
   * verify -> hydra jwt-bearer -> mint
   * @param code
   */
  async getAuthIdToken(code: string): Promise<AuthTokenResponse> {
    const verifyRes = await fetch(
      `${this.#getProfileSyncAuthApiUrl()}${this.OAUTH_SERVER_VERIFY_PATH}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          code_verifier: this.codeVerifier,
          code,
        }),
      },
    );
    if (!verifyRes.ok) {
      throw new Error(
        `Telegram verify failed: ${verifyRes.status} ${verifyRes.statusText}`,
      );
    }
    const verifyData = await verifyRes.json();

    const hydraIdToken = await this.#exchangeJwtBearerForOidcAccessToken(
      verifyData?.token,
    );

    const mintRes = await fetch(
      `${this.options.authServerUrl}${this.OAUTH_SERVER_MINT_PATH}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          id_token: hydraIdToken,
        }),
      },
    );
    if (!mintRes.ok) {
      throw new Error(`Mint failed: ${mintRes.status} ${mintRes.statusText}`);
    }

    const mintData: AuthTokenResponse = await mintRes.json();

    // check if telegram profile is already synced by looking for the alias in ext field
    const authPayload = JSON.parse(decodeIdToken(verifyData?.token));
    let profileSynced = false;
    const aliases: {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      alias_profile_id?: string;
    }[] = authPayload?.ext?.[this.#getProfileAliasesClaimKey()] || [];
    for (const alias of aliases) {
      if (alias.alias_profile_id === authPayload.sub) {
        profileSynced = true;
        break;
      }
    }

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    mintData.profile_pairing_token = hydraIdToken;

    return mintData;
  }

  async getUserInfo(idToken: string): Promise<OAuthUserInfo> {
    const payload = JSON.parse(decodeIdToken(idToken));

    return {
      email: payload.email,
      sub: payload.sub ?? payload.user_id ?? '',
    };
  }
}
