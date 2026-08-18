import { startHeldSession } from '../fixtures/held-fixtures';

describe('startHeldSession', () => {
  it('returns context before the fixture run finishes', async () => {
    let released = false;
    const session = await startHeldSession(async (callback) => {
      await callback({ ok: true });
      released = true;
    });

    expect(session.context).toStrictEqual({ ok: true });
    expect(released).toBe(false);

    await session.release();
    expect(released).toBe(true);
  });

  it('rejects the fixture run when release is called with an error', async () => {
    const session = await startHeldSession(async (callback) => {
      await callback({ ok: true });
    });

    await expect(session.release(new Error('failed'))).rejects.toThrow(
      'failed',
    );
  });

  it('throws if the fixture run fails before context is ready', async () => {
    await expect(
      startHeldSession(async () => {
        throw new Error('startup failed');
      }),
    ).rejects.toThrow('startup failed');
  });
});
