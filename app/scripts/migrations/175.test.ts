import { migrate, version } from './175';

const oldVersion = 174;

describe('migration #175', () => {
  it('should update the version metadata', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {},
    };

    const newState = await migrate(oldState);
    expect(newState.meta).toStrictEqual({ version });
  });

  it('should not overrite existing showAccountIconTour', async () => {
    const oldState = {
      meta: {
        version: oldVersion,
      },
      data: {
        AppStateController: {
          showAccountIconTour: false,
        },
      },
    };

    const newState = await migrate(oldState);
    expect(newState).toStrictEqual({
      meta: {
        version: 175,
      },
      data: {
        AppStateController: {
          showAccountIconTour: false,
        },
      },
    });
  });

  it('should create showAccountIconTour if it does not exist', async () => {
    const oldState = {
      meta: {
        version: oldVersion,
      },
      data: {
        AppStateController: {},
      },
    };

    const newState = await migrate(oldState);
    expect(newState).toStrictEqual({
      meta: {
        version: 175,
      },
      data: {
        AppStateController: {
          showAccountIconTour: true,
        },
      },
    });
  });
});
