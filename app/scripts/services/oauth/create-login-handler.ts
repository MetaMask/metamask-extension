import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { AppleLoginHandler } from './apple-login-handler';
import { GoogleLoginHandler } from './google-login-handler';
import type {
  LoginHandlerOptions,
  OAuthConfig,
  OAuthLoginEnv,
  WebAuthenticator,
} from './types';

export function createLoginHandler(
  authConnection: AuthConnection,
  config: OAuthConfig & OAuthLoginEnv,
  webAuthenticator: WebAuthenticator,
) {
  const commonHandlerOptions: Omit<LoginHandlerOptions, 'oAuthClientId'> = {
    web3AuthNetwork: config.web3AuthNetwork,
    authServerUrl: config.authServerUrl,
    webAuthenticator,
  };

  switch (authConnection) {
    case AuthConnection.Google:
      return new GoogleLoginHandler({
        ...commonHandlerOptions,
        oAuthClientId: config.googleClientId,
      });
    case AuthConnection.Apple:
      return new AppleLoginHandler({
        ...commonHandlerOptions,
        oAuthClientId: config.appleClientId,
      });
    default:
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Invalid social login provider: ${authConnection}`);
  }
}
