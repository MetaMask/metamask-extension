import {
  ClientConfigApiService,
  RemoteFeatureFlagController,
} from '@metamask/remote-feature-flag-controller';
import {
  ActionConstraint,
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { ENVIRONMENT } from '../../../development/build/constants';
import { PreferencesControllerGetStateAction } from '../controllers/preferences-controller';
import { OnboardingControllerGetStateAction } from '../controllers/onboarding';
import {
  getConfigForRemoteFeatureFlagRequest,
  RemoteFeatureFlagControllerInit,
} from './remote-feature-flag-controller-init';
import { ControllerInitRequest } from './types';
import {
  getRemoteFeatureFlagControllerInitMessenger,
  getRemoteFeatureFlagControllerMessenger,
  RemoteFeatureFlagControllerInitMessenger,
  RemoteFeatureFlagControllerMessenger,
} from './messengers';
import { buildControllerInitRequestMock } from './test/utils';

jest.mock('@metamask/remote-feature-flag-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    RemoteFeatureFlagControllerMessenger,
    RemoteFeatureFlagControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<
    MockAnyNamespace,
    | PreferencesControllerGetStateAction
    | OnboardingControllerGetStateAction
    | ActionConstraint,
    never
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });

  baseMessenger.registerActionHandler(
    'PreferencesController:getState',
    jest.fn().mockReturnValue({
      useExternalServices: true,
    }),
  );
  baseMessenger.registerActionHandler(
    'OnboardingController:getState',
    jest.fn().mockReturnValue({
      completedOnboarding: true,
    }),
  );

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getRemoteFeatureFlagControllerMessenger(baseMessenger),
    initMessenger: getRemoteFeatureFlagControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('getConfigForRemoteFeatureFlagRequest', () => {
  it('returns config in mapping', () => {
    const result = getConfigForRemoteFeatureFlagRequest();
    expect(result).toStrictEqual({
      distribution: 'main',
      environment: 'dev',
    });
  });

  it('returns config when not matching default mapping', () => {
    process.env.METAMASK_BUILD_TYPE = 'non-existent-distribution';
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.RELEASE_CANDIDATE;

    const result = getConfigForRemoteFeatureFlagRequest();
    expect(result).toStrictEqual({
      distribution: 'main',
      environment: 'rc',
    });
  });

  // @ts-expect-error ESLint is misconfigured and not applying Jest types to this file
  it.each(Object.values(ENVIRONMENT))(
    'returns main-exp for experimental build in "%s" environment',
    async (environment: keyof typeof ENVIRONMENT) => {
      process.env.METAMASK_BUILD_TYPE = 'experimental';
      process.env.METAMASK_ENVIRONMENT = environment;

      const result = getConfigForRemoteFeatureFlagRequest();
      expect(result).toStrictEqual({
        distribution: 'main',
        environment: 'exp',
      });
    },
  );
});

describe('RemoteFeatureFlagControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } =
      RemoteFeatureFlagControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(RemoteFeatureFlagController);
  });

  it('passes the proper arguments to the controller', () => {
    RemoteFeatureFlagControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(RemoteFeatureFlagController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      disabled: false,
      fetchInterval: expect.any(Number),
      getMetaMetricsId: expect.any(Function),
      clientConfigApiService: expect.any(ClientConfigApiService),
      clientVersion: expect.any(String),
    });
  });
});
