import { invokePerpsBalanceAction } from './invoke-perps-balance-action';

describe('invokePerpsBalanceAction', () => {
  it('logs when callback returns a rejected promise', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    invokePerpsBalanceAction(() => Promise.reject(new Error('fail')));

    await Promise.resolve();
    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('does nothing when callback is undefined', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    invokePerpsBalanceAction(undefined);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
