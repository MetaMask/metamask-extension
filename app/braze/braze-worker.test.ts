import { flushPromises } from '../../test/lib/timer-helpers';

describe('Braze worker bootstrap', () => {
  beforeEach(() => jest.resetModules());

  it('installs the restricted environment before loading the SDK host', async () => {
    const install = jest.fn();
    const sync = jest.fn().mockResolvedValue(undefined);
    const createHost = jest.fn(() => {
      expect(install).toHaveBeenCalledTimes(1);
      return sync;
    });
    jest.doMock('./braze-worker-environment', () => ({
      installBrazeWorkerEnvironment: install,
    }));
    jest.doMock('./braze-sdk-host', () => ({ createBrazeSdkHost: createHost }));
    const post = jest
      .spyOn(globalThis, 'postMessage')
      .mockImplementation(() => undefined);
    const listen = jest
      .spyOn(globalThis, 'addEventListener')
      .mockImplementation(() => undefined);

    await import('./braze-worker');
    await flushPromises();
    const listener = listen.mock.calls.find(
      (call: unknown[]) => call[0] === 'message',
    )?.[1] as (event: MessageEvent<unknown>) => void;
    listener(
      new MessageEvent('message', { data: { id: 1, profileId: 'profile' } }),
    );
    await flushPromises();

    expect(createHost).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledWith('profile');
    expect(post).toHaveBeenCalledWith({ id: 1, success: true });
  });

  it('does not load the SDK host when the environment refuses startup', async () => {
    const createHost = jest.fn();
    jest.doMock('./braze-worker-environment', () => ({
      installBrazeWorkerEnvironment: () => {
        throw new Error('No worker isolation');
      },
    }));
    jest.doMock('./braze-sdk-host', () => ({ createBrazeSdkHost: createHost }));

    await expect(import('./braze-worker')).rejects.toThrow(
      'No worker isolation',
    );

    expect(createHost).not.toHaveBeenCalled();
  });
});
