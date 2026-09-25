/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import migration58 from './058';

type MigrationInput = Parameters<typeof migration58.migrate>[0];

describe('migration #58', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 57,
      },
      data: {},
    };

    const newStorage = await migration58.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.meta).toStrictEqual({
      version: 58,
    });
  });

  describe('deleting swapsWelcomeMessageHasBeenShown', () => {
    it('should delete the swapsWelcomeMessageHasBeenShown property', async () => {
      const oldStorage = {
        meta: {},
        data: {
          AppStateController: {
            swapsWelcomeMessageHasBeenShown: false,
            bar: 'baz',
          },
          foo: 'bar',
        },
      };
      const newStorage = await migration58.migrate(
        oldStorage as unknown as MigrationInput,
      );
      expect(newStorage.data.AppStateController).toStrictEqual({ bar: 'baz' });
    });

    it('should not modify state if the AppStateController does not exist', async () => {
      const oldStorage = {
        meta: {},
        data: {
          foo: 'bar',
        },
      };
      const newStorage = await migration58.migrate(
        oldStorage as unknown as MigrationInput,
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });
  });
});
