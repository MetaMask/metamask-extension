import {
  BaseController,
  RestrictedControllerMessenger,
  StateMetadata,
} from '@metamask/base-controller';
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import {
  AccessToken,
  AuthType,
  JwtBearerAuth,
  LoginResponse,
  UserProfile,
} from '../profile-sync-sdk/authentication';
import { Env } from '../profile-sync-sdk/env';
import {
  createSnapPublicKeyRequest,
  createSnapSignMessageRequest,
} from './auth-snap-requests';

const controllerName = 'AuthenticationController';

// State
export type AuthenticationControllerState = {
  /**
   * Global isSignedIn state.
   * Can be used to determine if "Profile Syncing" is enabled.
   */
  isSignedIn: boolean;
  loginResponseSession?: LoginResponse;
};
const defaultState: AuthenticationControllerState = { isSignedIn: false };
const metadata: StateMetadata<AuthenticationControllerState> = {
  isSignedIn: {
    persist: true,
    anonymous: true,
  },
  loginResponseSession: {
    persist: true,
    anonymous: false,
  },
};

// Messenger Actions
type CreateActionsObj<T extends keyof AuthenticationController> = {
  [K in T]: {
    type: `${typeof controllerName}:${K}`;
    handler: AuthenticationController[K];
  };
};
type ActionsObj = CreateActionsObj<
  | 'performSignIn'
  | 'performSignOut'
  | 'getBearerToken'
  | 'getSessionProfile'
  | 'isSignedIn'
>;
export type Actions = ActionsObj[keyof ActionsObj];
export type AuthenticationControllerPerformSignIn = ActionsObj['performSignIn'];
export type AuthenticationControllerPerformSignOut =
  ActionsObj['performSignOut'];
export type AuthenticationControllerGetBearerToken =
  ActionsObj['getBearerToken'];
export type AuthenticationControllerGetSessionProfile =
  ActionsObj['getSessionProfile'];
export type AuthenticationControllerIsSignedIn = ActionsObj['isSignedIn'];

// Allowed Actions
export type AllowedActions = HandleSnapRequest;

// Messenger
export type AuthenticationControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  Actions | AllowedActions,
  never,
  AllowedActions['type'],
  never
>;

/**
 * Controller that enables authentication for restricted endpoints.
 * Used for Global Profile Syncing and Notifications
 */
export default class AuthenticationController extends BaseController<
  typeof controllerName,
  AuthenticationControllerState,
  AuthenticationControllerMessenger
> {
  // Declare Auth SDK
  #authSDK = new JwtBearerAuth(
    {
      env: Env.PRD,
      type: AuthType.SRP,
    },
    {
      signing: {
        getIdentifier: () => this.#snapGetPublicKey(),
        signMessage: (m) => this.#snapSignMessage(m),
      },
      storage: {
        getLoginResponse: async () => this.state.loginResponseSession ?? null,
        setLoginResponse: async (res) => {
          this.update((s) => {
            s.loginResponseSession = res;
          });
        },
      },
    },
  );

  constructor({
    messenger,
    state,
  }: {
    messenger: AuthenticationControllerMessenger;
    state?: AuthenticationControllerState;
  }) {
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...defaultState, ...state },
    });

    this.#registerMessageHandlers();
  }

  /**
   * Constructor helper for registering this controller's messaging system
   * actions.
   */
  #registerMessageHandlers(): void {
    this.messagingSystem.registerActionHandler(
      'AuthenticationController:getBearerToken',
      this.getBearerToken.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      'AuthenticationController:getSessionProfile',
      this.getSessionProfile.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      'AuthenticationController:isSignedIn',
      this.isSignedIn.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      'AuthenticationController:performSignIn',
      this.performSignIn.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      'AuthenticationController:performSignOut',
      this.performSignOut.bind(this),
    );
  }

  public async performSignIn(): Promise<string> {
    const { accessToken } = await this.#authSDK.getAccessToken();
    return accessToken;
  }

  public performSignOut(): void {
    this.#assertLoggedIn();

    this.update((state) => {
      state.isSignedIn = false;
      state.loginResponseSession = undefined;
    });
  }

  public async getBearerToken(): Promise<AccessToken> {
    this.#assertLoggedIn();

    // Hmm I don't know if this is leaky...
    // We should either return a string, or the access token shape.
    return await this.#authSDK.getAccessToken();
  }

  /**
   * Will return a session profile.
   * Throws if a user is not logged in.
   *
   * @returns profile for the session.
   */
  public async getSessionProfile(): Promise<UserProfile> {
    this.#assertLoggedIn();

    // I think the lib handles the valid auth profile
    const profile = await this.#authSDK.getUserProfile();
    return profile;
  }

  public isSignedIn(): boolean {
    return this.state.isSignedIn;
  }

  #assertLoggedIn(): void {
    if (!this.state.isSignedIn) {
      throw new Error(
        `${controllerName}: Unable to call method, user is not authenticated`,
      );
    }
  }

  /**
   * Returns the auth snap public key.
   *
   * @returns The snap public key.
   */
  #snapGetPublicKey(): Promise<string> {
    return this.messagingSystem.call(
      'SnapController:handleRequest',
      createSnapPublicKeyRequest(),
    ) as Promise<string>;
  }

  /**
   * Signs a specific message using an underlying auth snap.
   *
   * @param message - A specific tagged message to sign.
   * @returns A Signature created by the snap.
   */
  #snapSignMessage(message: string): Promise<string> {
    return this.messagingSystem.call(
      'SnapController:handleRequest',
      createSnapSignMessageRequest(message),
    ) as Promise<string>;
  }
}
