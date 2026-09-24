import type { ProfileSignInInfo } from '@metamask/profile-sync-controller/auth';
import type { PreferencesController } from '../controllers/preferences-controller';
import {
  applyLinkedSocialLoginProfileDetection,
  registerLinkedSocialLoginProfileSync,
} from './sync-linked-social-login-profile';

describe('applyLinkedSocialLoginProfileDetection', () => {
  it('persists the linked-social flag and repairs already-consolidated wallets', () => {
    const preferencesController = {
      getPreferences: jest.fn(() => ({
        hasLinkedSocialLoginProfile: false,
        isBasicFunctionalityConsolidatedEnabled: true,
      })),
      setPreference: jest.fn(),
      consolidateBasicFunctionality: jest.fn(),
    } as unknown as PreferencesController;

    applyLinkedSocialLoginProfileDetection(preferencesController, true);

    expect(preferencesController.setPreference).toHaveBeenCalledWith(
      'hasLinkedSocialLoginProfile',
      true,
    );
    expect(
      preferencesController.consolidateBasicFunctionality,
    ).toHaveBeenCalledTimes(1);
  });

  it('does not consolidate unmarked wallets so the remote kill switch still applies', () => {
    const preferencesController = {
      getPreferences: jest.fn(() => ({
        hasLinkedSocialLoginProfile: false,
        isBasicFunctionalityConsolidatedEnabled: false,
      })),
      setPreference: jest.fn(),
      consolidateBasicFunctionality: jest.fn(),
    } as unknown as PreferencesController;

    applyLinkedSocialLoginProfileDetection(preferencesController, true);

    expect(preferencesController.setPreference).toHaveBeenCalledWith(
      'hasLinkedSocialLoginProfile',
      true,
    );
    expect(
      preferencesController.consolidateBasicFunctionality,
    ).not.toHaveBeenCalled();
  });

  it('does nothing when linked social identifiers are absent', () => {
    const preferencesController = {
      getPreferences: jest.fn(),
      setPreference: jest.fn(),
      consolidateBasicFunctionality: jest.fn(),
    } as unknown as PreferencesController;

    applyLinkedSocialLoginProfileDetection(preferencesController, false);

    expect(preferencesController.setPreference).not.toHaveBeenCalled();
    expect(
      preferencesController.consolidateBasicFunctionality,
    ).not.toHaveBeenCalled();
  });
});

describe('registerLinkedSocialLoginProfileSync', () => {
  it('reacts to profile sign-in events with social aliases', () => {
    const preferencesController = {
      getPreferences: jest.fn(() => ({
        hasLinkedSocialLoginProfile: false,
        isBasicFunctionalityConsolidatedEnabled: true,
      })),
      setPreference: jest.fn(),
      consolidateBasicFunctionality: jest.fn(),
    } as unknown as PreferencesController;
    const handlers: Record<string, (payload: ProfileSignInInfo) => void> = {};
    const messenger = {
      subscribe: jest.fn((event, handler) => {
        handlers[event] = handler;
      }),
    };

    registerLinkedSocialLoginProfileSync(
      messenger as never,
      preferencesController,
    );

    handlers['AuthenticationController:profileSignIn']({
      profileId: 'profile-1',
      profileIdChanged: false,
      profileAliases: [
        {
          aliasProfileId: 'alias-1',
          canonicalProfileId: 'profile-1',
          identifierIds: [{ id: 'google-id', type: 'GOOGLE' }],
        },
      ],
    });

    expect(preferencesController.setPreference).toHaveBeenCalledWith(
      'hasLinkedSocialLoginProfile',
      true,
    );
  });

  it('reacts to auth state changes with paired identifiers', () => {
    const preferencesController = {
      getPreferences: jest.fn(() => ({
        hasLinkedSocialLoginProfile: false,
        isBasicFunctionalityConsolidatedEnabled: true,
      })),
      setPreference: jest.fn(),
      consolidateBasicFunctionality: jest.fn(),
    } as unknown as PreferencesController;
    const handlers: Record<string, (payload: unknown) => void> = {};
    const messenger = {
      subscribe: jest.fn((event, handler) => {
        handlers[event] = handler;
      }),
    };

    registerLinkedSocialLoginProfileSync(
      messenger as never,
      preferencesController,
    );

    handlers['AuthenticationController:stateChange']({
      isSignedIn: true,
      pairedIdentifierIds: [{ type: 'APPLE' }],
      srpSessionData: {
        'entropy-1': {
          pairedIdentifierIds: [{ type: 'APPLE' }],
          profile: {
            identifierId: 'id-1',
            metaMetricsId: 'mm-1',
            profileId: 'profile-1',
            canonicalProfileId: 'profile-1',
          },
          token: {
            accessToken: 'token',
            expiresIn: 3600,
            obtainedAt: 1,
          },
        },
      },
    });

    expect(preferencesController.setPreference).toHaveBeenCalledWith(
      'hasLinkedSocialLoginProfile',
      true,
    );
  });
});
