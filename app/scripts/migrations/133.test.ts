import { cloneDeep } from 'lodash';
import { migrate, version } from './133';

const oldVersion = 132;

describe('migration #133', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe('NotificationController', () => {
    it('does nothing if NotificationController is not in state', async () => {
      const oldState = {
        OtherController: {},
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('deletes the NotificationController from state', async () => {
      const oldState = {
        NotificationController: {},
        OtherController: {},
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual({ OtherController: {} });
    });
  });
});
