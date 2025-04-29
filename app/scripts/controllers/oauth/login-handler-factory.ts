import { AuthConnection } from '@metamask-previews/seedless-onboarding-controller';
import { AppleLoginHandler } from './apple-login-handler';
import { GoogleLoginHandler } from './google-login-handler';
import { LoginHandlerOptions, OAuthLoginEnv } from './types';

export function createLoginHandler(
  authConnection: AuthConnection,
  redirectUri: string,
  env: OAuthLoginEnv,
) {
  const commonHandlerOptions: Omit<LoginHandlerOptions, 'oAuthClientId'> = {
    web3AuthNetwork: env.web3AuthNetwork,
    redirectUri,
    authServerUrl: env.authServerUrl,
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
      throw new Error('Invalid provider');
  }
}
