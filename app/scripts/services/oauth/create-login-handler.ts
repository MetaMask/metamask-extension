import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { AppleLoginHandler } from './apple-login-handler';
import { GoogleLoginHandler } from './google-login-handler';
import type {
  LoginHandlerOptions,
  OAuthConfig,
  WebAuthenticator,
} from './types';

export function createLoginHandler(
  authConnection: AuthConnection,
  env: OAuthConfig,
  webAuthenticator: WebAuthenticator,
) {
  const commonHandlerOptions: Omit<LoginHandlerOptions, 'oAuthClientId'> = {
    web3AuthNetwork: env.web3AuthNetwork,
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
      });
    default:
      throw new Error(`Invalid social login provider: ${authConnection}`);
  }
}
