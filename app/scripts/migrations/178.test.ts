import { migrate, version } from './178';

const oldVersion = 177;

describe('migration #178', () => {
  it('should update the version metadata', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {},
    };

    const newState = await migrate(oldState);
    expect(newState.meta).toStrictEqual({ version });
  });

  it('should not overwrite existing productTour', async () => {
    const oldState = {
      meta: {
        version: oldVersion,
      },
      data: {
        AppStateController: {
          productTour: 'someOtherTour',
        },
      },
    };

    const newState = await migrate(oldState);
    expect(newState).toStrictEqual({
      meta: {
        version: 178,
      },
      data: {
        AppStateController: {
          productTour: 'someOtherTour',
        },
      },
    });
  });

  it('should create productTour if it does not exist', async () => {
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
        version: 178,
      },
      data: {
        AppStateController: {
          productTour: 'accountIcon',
        },
      },
    });
  });
});
