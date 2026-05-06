import {
  GeolocationController,
  getDefaultGeolocationControllerState,
  type GeolocationControllerMessenger,
  type GeolocationControllerState,
} from '@metamask/geolocation-controller';
import { vi } from 'vitest';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { GeolocationControllerInit } from './geolocation-controller-init';

const geolocationControllerMocks = vi.hoisted(() => {
  const defaultState = {
    location: '',
    status: 'idle' as const,
    lastFetchedAt: null,
    error: null,
  };

  return {
    defaultState,
    getDefaultGeolocationControllerState: vi
      .fn()
      .mockReturnValue({ ...defaultState }),
    GeolocationController: vi.fn().mockImplementation(() => ({
      getGeolocation: vi.fn().mockResolvedValue('US'),
      refreshGeolocation: vi.fn().mockResolvedValue('US'),
    })),
  };
});

const DEFAULT_STATE =
  geolocationControllerMocks.defaultState as GeolocationControllerState;

jest.mock('@metamask/geolocation-controller', async () => {
  const actual = await vi.importActual<
    typeof import('@metamask/geolocation-controller')
  >('@metamask/geolocation-controller');

  return {
    ...actual,
    getDefaultGeolocationControllerState:
      geolocationControllerMocks.getDefaultGeolocationControllerState,
    GeolocationController: geolocationControllerMocks.GeolocationController,
  };
});

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<GeolocationControllerMessenger>
> {
  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: {} as GeolocationControllerMessenger,
    initMessenger: undefined,
  };
}

describe('GeolocationControllerInit', () => {
  const GeolocationControllerMock = jest.mocked(GeolocationController);

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(getDefaultGeolocationControllerState)
      .mockReturnValue({ ...DEFAULT_STATE });
  });

  it('initializes the controller', () => {
    const { messengerClient } = GeolocationControllerInit(getInitRequestMock());
    expect(messengerClient).toBeDefined();
  });

  it('passes persisted state to the controller when available', () => {
    const request = getInitRequestMock();
    request.persistedState.GeolocationController = {
      location: 'US',
    };

    GeolocationControllerInit(request);

    expect(GeolocationControllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: expect.objectContaining({ location: 'US' }),
    });
  });

  it('uses default state when no persisted state exists', () => {
    GeolocationControllerInit(getInitRequestMock());

    expect(GeolocationControllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: DEFAULT_STATE,
    });
  });

  it('does not eagerly fetch geolocation', () => {
    const { messengerClient } = GeolocationControllerInit(getInitRequestMock());
    expect(messengerClient.getGeolocation).not.toHaveBeenCalled();
  });

  it('exposes getGeolocation and refreshGeolocation on the background API', () => {
    const result = GeolocationControllerInit(getInitRequestMock());

    expect(typeof result.api?.getGeolocation).toBe('function');
    expect(typeof result.api?.refreshGeolocation).toBe('function');
  });

  it('delegates api.getGeolocation to the controller', async () => {
    const result = GeolocationControllerInit(getInitRequestMock());

    await expect(result.api?.getGeolocation()).resolves.toBe('US');
    expect(result.messengerClient.getGeolocation).toHaveBeenCalledTimes(1);
  });

  it('delegates api.refreshGeolocation to the controller', async () => {
    const result = GeolocationControllerInit(getInitRequestMock());

    await expect(result.api?.refreshGeolocation()).resolves.toBe('US');
    expect(result.messengerClient.refreshGeolocation).toHaveBeenCalledTimes(1);
  });
});
