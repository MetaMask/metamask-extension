import migration72 from './072';

describe('migration #72', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 71,
      },
      data: {},
    };

    const newStorage = await migration72.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 72,
    });
  });

  it('should delete the ThreeBoxController', async () => {
    const oldStorage = {
      meta: {
        version: 71,
      },
      data: {
        FooController: { a: 'b' },
        ThreeBoxController: {
          stuff: 'stuff!',
          moreStuff: { moreStuff: ['stuff', 'stuff', 'stuff'] },
        },
      },
    };

    const newStorage = await migration72.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 72,
      },
      data: {
        FooController: { a: 'b' },
      },
    });
  });

  it('should handle missing ThreeBoxController', async () => {
    const oldStorage = {
      meta: {
        version: 71,
      },
      data: {
        FooController: { a: 'b' },
      },
    };

    const newStorage = await migration72.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 72,
      },
      data: {
        FooController: { a: 'b' },
      },
    });
  });
});
