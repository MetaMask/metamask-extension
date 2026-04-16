import {
  GeolocationController,
  getDefaultGeolocationControllerState,
  UNKNOWN_LOCATION,
  type GeolocationControllerMessenger,
} from '@metamask/geolocation-controller';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { GeolocationControllerInit } from './geolocation-controller-init';

jest.mock('@metamask/geolocation-controller', () => ({
  ...jest.requireActual('@metamask/geolocation-controller'),
  getDefaultGeolocationControllerState: jest.fn().mockReturnValue({
    location: '',
  }),
  GeolocationController: jest.fn().mockImplementation(() => ({
    getGeolocation: jest.fn().mockResolvedValue('US'),
  })),
}));

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<GeolocationControllerMessenger>
> {
  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: {} as GeolocationControllerMessenger,
    initMessenger: undefined,
  };

  return requestMock;
}

describe('GeolocationControllerInit', () => {
  const GeolocationControllerMock = jest.mocked(GeolocationController);

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(getDefaultGeolocationControllerState)
      .mockReturnValue({ location: '' });
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
      state: { location: 'US' },
    });
  });

  it('uses default state when no persisted state exists', () => {
    jest
      .mocked(getDefaultGeolocationControllerState)
      .mockReturnValue({ location: '' });

    GeolocationControllerInit(getInitRequestMock());

    expect(GeolocationControllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: { location: '' },
    });
  });

  it('fetches geolocation when location is UNKNOWN_LOCATION', () => {
    jest
      .mocked(getDefaultGeolocationControllerState)
      .mockReturnValue({ location: UNKNOWN_LOCATION });

    const { messengerClient } = GeolocationControllerInit(getInitRequestMock());
    expect(messengerClient.getGeolocation).toHaveBeenCalled();
  });

  it('fetches geolocation when location is empty string', () => {
    jest
      .mocked(getDefaultGeolocationControllerState)
      .mockReturnValue({ location: '' });

    const { messengerClient } = GeolocationControllerInit(getInitRequestMock());
    expect(messengerClient.getGeolocation).toHaveBeenCalled();
  });

  it('does not fetch geolocation when location is already known', () => {
    const request = getInitRequestMock();
    request.persistedState.GeolocationController = {
      location: 'US',
    };

    const { messengerClient } = GeolocationControllerInit(request);
    expect(messengerClient.getGeolocation).not.toHaveBeenCalled();
  });

  it('does not throw when getGeolocation rejects', async () => {
    const getGeolocationMock = jest
      .fn()
      .mockRejectedValue(new Error('network error'));
    GeolocationControllerMock.mockImplementationOnce(
      () =>
        ({
          getGeolocation: getGeolocationMock,
        }) as unknown as GeolocationController,
    );

    expect(() => GeolocationControllerInit(getInitRequestMock())).not.toThrow();
  });
});
