import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { RewardsMoneyController } from '../controllers/rewards-money/rewards-money-controller';
import { getRootMessenger } from '../lib/messenger';
import {
  getRewardsMoneyControllerInitMessenger,
  getRewardsMoneyControllerMessenger,
} from './messengers/rewards-money-controller-messenger';
import { RewardsMoneyControllerInit } from './rewards-money-controller-init';
import { buildControllerInitRequestMock } from './test/utils';
import type { RewardsMoneyControllerMessenger } from '../controllers/rewards-money/rewards-money-controller-types';
import type { RewardsMoneyControllerInitMessenger } from './messengers/rewards-money-controller-messenger';
import type { MessengerClientInitRequest } from './types';

jest.mock('../controllers/rewards-money/rewards-money-controller');
jest.mock('../../../shared/lib/manifestFlags');

const mockGetManifestFlags = jest.mocked(getManifestFlags);

const enabledFlag = { enabled: true, minimumVersion: '0.0.0' };

function buildInitRequestMock(
  remoteFeatureFlags?: Record<string, unknown>,
  useExternalServices = true,
): jest.Mocked<
  MessengerClientInitRequest<
    RewardsMoneyControllerMessenger,
    RewardsMoneyControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger<never, never>();
  const initMessenger = getRewardsMoneyControllerInitMessenger(
    baseControllerMessenger,
  );

  jest.spyOn(initMessenger, 'call').mockImplementation((action: string) => {
    if (action === 'RemoteFeatureFlagController:getState') {
      return { remoteFeatureFlags: remoteFeatureFlags ?? {} } as never;
    }
    if (action === 'PreferencesController:getState') {
      return { useExternalServices } as never;
    }
    return undefined as never;
  });

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getRewardsMoneyControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger,
  };
}

function readIsDisabled(
  requestMock: MessengerClientInitRequest<
    RewardsMoneyControllerMessenger,
    RewardsMoneyControllerInitMessenger
  >,
): boolean {
  RewardsMoneyControllerInit(requestMock);
  const [constructorArgs] = jest.mocked(RewardsMoneyController).mock.calls[0];
  return constructorArgs.isDisabled();
}

describe('RewardsMoneyControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetManifestFlags.mockReturnValue({
      remoteFeatureFlags: undefined,
    } as never);
  });

  it('enables the controller when the flag is on and external services are allowed', () => {
    const requestMock = buildInitRequestMock({
      rewardsMoneyControllerEnabled: enabledFlag,
    });

    expect(readIsDisabled(requestMock)).toBe(false);
  });

  it('disables the controller when the flag is missing', () => {
    expect(readIsDisabled(buildInitRequestMock({}))).toBe(true);
  });

  it('disables the controller when the flag is off', () => {
    const requestMock = buildInitRequestMock({
      rewardsMoneyControllerEnabled: {
        enabled: false,
        minimumVersion: '0.0.0',
      },
    });

    expect(readIsDisabled(requestMock)).toBe(true);
  });

  it('disables the controller when the client version is below the flag minimum', () => {
    const requestMock = buildInitRequestMock({
      rewardsMoneyControllerEnabled: {
        enabled: true,
        minimumVersion: '99.0.0',
      },
    });

    expect(readIsDisabled(requestMock)).toBe(true);
  });

  it('disables the controller when the flag shape is invalid', () => {
    const requestMock = buildInitRequestMock({
      rewardsMoneyControllerEnabled: true,
    });

    expect(readIsDisabled(requestMock)).toBe(true);
  });

  it('disables the controller when external services are off', () => {
    const requestMock = buildInitRequestMock(
      { rewardsMoneyControllerEnabled: enabledFlag },
      false,
    );

    expect(readIsDisabled(requestMock)).toBe(true);
  });

  it('uses the manifest override ahead of the remote flag', () => {
    mockGetManifestFlags.mockReturnValue({
      remoteFeatureFlags: {
        rewardsMoneyControllerEnabled: enabledFlag,
      },
    } as never);
    const requestMock = buildInitRequestMock({
      rewardsMoneyControllerEnabled: {
        enabled: false,
        minimumVersion: '0.0.0',
      },
    });

    expect(readIsDisabled(requestMock)).toBe(false);
  });
});
