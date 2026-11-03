import {
  AssetsController,
  type AssetsControllerMessenger,
} from '@metamask/assets-controller';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { AssetsControllerInit } from './assets-controller-init';

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<AssetsControllerMessenger>
> {
  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: {} as AssetsControllerMessenger,
  } as jest.Mocked<MessengerClientInitRequest<AssetsControllerMessenger>>;
}

describe('AssetsControllerInit', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('runs init on the wallet instance and does not persist it again', () => {
    const request = getInitRequestMock();
    const messengerClient = {
      init: jest.fn().mockResolvedValue(undefined),
    } as unknown as AssetsController;
    request.getMessengerClient.mockReturnValue(messengerClient);

    expect(AssetsControllerInit(request)).toEqual({
      messengerClient,
      persistedStateKey: null,
      memStateKey: null,
    });
    expect(request.getMessengerClient).toHaveBeenCalledWith('AssetsController');
    expect(messengerClient.init).toHaveBeenCalledTimes(1);
  });

  it('logs when init rejects', async () => {
    const request = getInitRequestMock();
    const error = new Error('init failed');
    const messengerClient = {
      init: jest.fn().mockRejectedValue(error),
    } as unknown as AssetsController;
    request.getMessengerClient.mockReturnValue(messengerClient);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    AssetsControllerInit(request);
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith(error);
  });
});
