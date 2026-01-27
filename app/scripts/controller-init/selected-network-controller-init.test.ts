import { SelectedNetworkController } from '@metamask/selected-network-controller';
import { WeakRefObjectMap } from '../lib/WeakRefObjectMap';
import { getRootMessenger } from '../lib/messenger';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getSelectedNetworkControllerMessenger,
  SelectedNetworkControllerMessenger,
} from './messengers';
import { SelectedNetworkControllerInit } from './selected-network-controller-init';

jest.mock('@metamask/selected-network-controller');

function getInitRequestMock(
  messengerOverrides?: Partial<SelectedNetworkControllerMessenger>,
): jest.Mocked<
  ControllerInitRequest<SelectedNetworkControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();
  const messenger = getSelectedNetworkControllerMessenger(baseMessenger);

  // Apply overrides if provided
  if (messengerOverrides) {
    Object.assign(messenger, messengerOverrides);
  }

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: messenger,
    initMessenger: undefined,
  };

  return requestMock;
}

describe('SelectedNetworkControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { controller } = SelectedNetworkControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(SelectedNetworkController);
  });

  it('passes the proper arguments to the controller when state is undefined', () => {
    SelectedNetworkControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SelectedNetworkController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      domainProxyMap: expect.any(WeakRefObjectMap),
    });
  });

  it('cleans up stale domains from persisted state', () => {
    const mockGetSubjectNames = jest.fn().mockReturnValue(['example.com']);
    const mockMessenger = {
      call: mockGetSubjectNames,
    };

    const requestMock = getInitRequestMock(
      mockMessenger as unknown as Partial<SelectedNetworkControllerMessenger>,
    );

    requestMock.persistedState = {
      SelectedNetworkController: {
        domains: {
          'example.com': 'mainnet',
          'stale-domain.com': 'goerli', // This domain no longer has permissions
        },
      },
    };

    SelectedNetworkControllerInit(requestMock);

    const controllerMock = jest.mocked(SelectedNetworkController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: {
        domains: {
          'example.com': 'mainnet',
          // stale-domain.com should be removed
        },
      },
      domainProxyMap: expect.any(WeakRefObjectMap),
    });
    expect(mockGetSubjectNames).toHaveBeenCalledWith(
      'PermissionController:getSubjectNames',
    );
  });

  it('handles state with no domains property', () => {
    const requestMock = getInitRequestMock();
    requestMock.persistedState = {
      SelectedNetworkController: {
        someOtherProperty: 'value',
      },
    };

    SelectedNetworkControllerInit(requestMock);

    const controllerMock = jest.mocked(SelectedNetworkController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: {
        someOtherProperty: 'value',
      },
      domainProxyMap: expect.any(WeakRefObjectMap),
    });
  });

  it('handles errors during cleanup gracefully', () => {
    const mockMessenger = {
      call: jest.fn().mockImplementation(() => {
        throw new Error('Permission controller not available');
      }),
    };

    const requestMock = getInitRequestMock(
      mockMessenger as unknown as Partial<SelectedNetworkControllerMessenger>,
    );

    requestMock.persistedState = {
      SelectedNetworkController: {
        domains: {
          'example.com': 'mainnet',
        },
      },
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    SelectedNetworkControllerInit(requestMock);

    const controllerMock = jest.mocked(SelectedNetworkController);
    // Should fall back to original state on error
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: {
        domains: {
          'example.com': 'mainnet',
        },
      },
      domainProxyMap: expect.any(WeakRefObjectMap),
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to cleanup stale domains in SelectedNetworkController:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it('preserves all domains when all have permissions', () => {
    const mockGetSubjectNames = jest
      .fn()
      .mockReturnValue(['example.com', 'another-domain.com']);
    const mockMessenger = {
      call: mockGetSubjectNames,
    };

    const requestMock = getInitRequestMock(
      mockMessenger as unknown as Partial<SelectedNetworkControllerMessenger>,
    );

    requestMock.persistedState = {
      SelectedNetworkController: {
        domains: {
          'example.com': 'mainnet',
          'another-domain.com': 'goerli',
        },
      },
    };

    SelectedNetworkControllerInit(requestMock);

    const controllerMock = jest.mocked(SelectedNetworkController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: {
        domains: {
          'example.com': 'mainnet',
          'another-domain.com': 'goerli',
        },
      },
      domainProxyMap: expect.any(WeakRefObjectMap),
    });
  });
});
