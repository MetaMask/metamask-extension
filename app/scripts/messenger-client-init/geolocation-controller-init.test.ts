import {
  GeolocationController,
  getDefaultGeolocationControllerState,
  UNKNOWN_LOCATION,
  type GeolocationControllerMessenger,
  type GeolocationControllerState,
} from '@metamask/geolocation-controller';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { GeolocationControllerInit } from './geolocation-controller-init';

const DEFAULT_STATE: GeolocationControllerState = {
  location: '',
  status: 'idle',
  lastFetchedAt: null,
  error: null,
};

jest.mock('@metamask/geolocation-controller', () => ({
  ...jest.requireActual('@metamask/geolocation-controller'),
  getDefaultGeolocationControllerState: jest
    .fn()
    .mockReturnValue({ ...DEFAULT_STATE }),
  GeolocationController: jest.fn().mockImplementation(() => ({
    getGeolocation: jest.fn().mockResolvedValue('US'),
  })),
}));

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

  describe('when location is unknown or empty', () => {
    it('fetches geolocation for UNKNOWN_LOCATION', () => {
      jest
        .mocked(getDefaultGeolocationControllerState)
        .mockReturnValue({ ...DEFAULT_STATE, location: UNKNOWN_LOCATION });

      const { messengerClient } =
        GeolocationControllerInit(getInitRequestMock());
      expect(messengerClient.getGeolocation).toHaveBeenCalled();
    });

    it('fetches geolocation for empty string', () => {
      const { messengerClient } =
        GeolocationControllerInit(getInitRequestMock());
      expect(messengerClient.getGeolocation).toHaveBeenCalled();
    });
  });

  describe('when location is already known', () => {
    it('does not fetch geolocation', () => {
      const request = getInitRequestMock();
      request.persistedState.GeolocationController = {
        location: 'US',
      };

      const { messengerClient } = GeolocationControllerInit(request);
      expect(messengerClient.getGeolocation).not.toHaveBeenCalled();
    });
  });

  it('does not throw when getGeolocation rejects', () => {
    GeolocationControllerMock.mockImplementationOnce(
      () =>
        ({
          getGeolocation: jest
            .fn()
            .mockRejectedValue(new Error('network error')),
        }) as unknown as GeolocationController,
    );

    expect(() => GeolocationControllerInit(getInitRequestMock())).not.toThrow();
  });
});
