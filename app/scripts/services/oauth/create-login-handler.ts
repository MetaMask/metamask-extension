import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { AppleLoginHandler } from './apple-login-handler';
import { GoogleLoginHandler } from './google-login-handler';
import type {
  LoginHandlerOptions,
  OAuthLoginEnv,
  WebAuthenticator,
} from './types';

export function createLoginHandler(
  authConnection: AuthConnection,
  redirectUri: string,
  env: OAuthLoginEnv,
  webAuthenticator: WebAuthenticator,
) {
  const commonHandlerOptions: Omit<LoginHandlerOptions, 'oAuthClientId'> = {
    web3AuthNetwork: env.web3AuthNetwork,
    redirectUri,
    authServerUrl: env.authServerUrl,
    webAuthenticator,
  };

  switch (authConnection) {
    case AuthConnection.Google:
      return new GoogleLoginHandler({
        ...commonHandlerOptions,
        oAuthClientId: env.googleClientId,
      });
    case AuthConnection.Apple:
      return new AppleLoginHandler({
        ...commonHandlerOptions,
        oAuthClientId: env.appleClientId,
        serverRedirectUri: env.serverRedirectUri,
      });
    default:
      throw new Error(`Invalid social login provider: ${authConnection}`);
  }
}
