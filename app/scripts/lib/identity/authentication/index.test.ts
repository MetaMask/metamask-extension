import type MetamaskController from '../../../metamask-controller';
import { performAutoSignIn } from '.';

type StateOverrides = {
  participateInMetaMetrics?: boolean;
  isSignedIn?: boolean;
  isProfileSyncingEnabled?: boolean;
  useExternalServices?: boolean;
  isUnlocked?: boolean;
};

const arrangeMocks = (stateOverrides?: StateOverrides) => {
  const performSignInMock = jest.fn();
  const metamaskControllerInstance = {
    metaMetricsController: {
      state: {
        participateInMetaMetrics: true,
        ...stateOverrides,
      },
    },
    authenticationController: {
      state: {
        isSignedIn: false,
        ...stateOverrides,
      },
      performSignIn: performSignInMock,
    },
    userStorageController: {
      state: {
        isProfileSyncingEnabled: true,
        ...stateOverrides,
      },
    },
    preferencesController: {
      state: {
        useExternalServices: true,
        ...stateOverrides,
      },
    },
    keyringController: {
      state: {
        isUnlocked: true,
        ...stateOverrides,
      },
    },
  } as unknown as MetamaskController;

  return { performSignInMock, metamaskControllerInstance };
};

describe('performAutoSignIn', () => {
  // @ts-expect-error This is missing from the Mocha type definitions
  it.each`
    participateInMetaMetrics | isSignedIn | isProfileSyncingEnabled | useExternalServices | isUnlocked
    ${false}                 | ${false}   | ${true}                 | ${true}             | ${true}
    ${true}                  | ${false}   | ${false}                | ${true}             | ${true}
    ${true}                  | ${false}   | ${true}                 | ${true}             | ${true}
  `(
    'should sign the user in when participateInMetaMetrics=$participateInMetaMetrics, isSignedIn=$isSignedIn, isProfileSyncingEnabled=$isProfileSyncingEnabled, useExternalServices=$useExternalServices, isUnlocked=$isUnlocked',
    ({
      participateInMetaMetrics,
      isSignedIn,
      isProfileSyncingEnabled,
      useExternalServices,
      isUnlocked,
    }: StateOverrides) => {
      const { performSignInMock, metamaskControllerInstance } = arrangeMocks({
        participateInMetaMetrics,
        isSignedIn,
        isProfileSyncingEnabled,
        useExternalServices,
        isUnlocked,
      });

      performAutoSignIn(metamaskControllerInstance);

      expect(performSignInMock).toHaveBeenCalled();
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each`
    participateInMetaMetrics | isSignedIn | isProfileSyncingEnabled | useExternalServices | isUnlocked
    ${false}                 | ${true}    | ${true}                 | ${true}             | ${true}
    ${false}                 | ${false}   | ${false}                | ${true}             | ${true}
    ${false}                 | ${false}   | ${true}                 | ${false}            | ${true}
    ${false}                 | ${false}   | ${true}                 | ${true}             | ${false}
    ${true}                  | ${true}    | ${true}                 | ${true}             | ${true}
    ${true}                  | ${false}   | ${true}                 | ${false}            | ${true}
    ${true}                  | ${false}   | ${true}                 | ${true}             | ${false}
  `(
    'should not sign the user in when participateInMetaMetrics=$participateInMetaMetrics, isSignedIn=$isSignedIn, isProfileSyncingEnabled=$isProfileSyncingEnabled, useExternalServices=$useExternalServices, isUnlocked=$isUnlocked',
    ({
      participateInMetaMetrics,
      isSignedIn,
      isProfileSyncingEnabled,
      useExternalServices,
      isUnlocked,
    }: StateOverrides) => {
      const { performSignInMock, metamaskControllerInstance } = arrangeMocks({
        participateInMetaMetrics,
        isSignedIn,
        isProfileSyncingEnabled,
        useExternalServices,
        isUnlocked,
      });

      performAutoSignIn(metamaskControllerInstance);

      expect(performSignInMock).not.toHaveBeenCalled();
    },
  );
});
