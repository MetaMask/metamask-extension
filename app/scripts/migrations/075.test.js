import migration75 from './075';

describe('migration #75', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 74,
      },
      data: {},
    };

    const newStorage = await migration75.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 75,
    });
  });

  it('should delete the ThreeBoxController', async () => {
    const oldStorage = {
      meta: {
        version: 74,
      },
      data: {
        FooController: { a: 'b' },
        ThreeBoxController: {
          stuff: 'stuff!',
          moreStuff: { moreStuff: ['stuff', 'stuff', 'stuff'] },
        },
      },
    };

    const newStorage = await migration75.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 75,
      },
      data: {
        FooController: { a: 'b' },
      },
    });
  });

  it('should handle missing ThreeBoxController', async () => {
    const oldStorage = {
      meta: {
        version: 74,
      },
      data: {
        FooController: { a: 'b' },
      },
    };

    const newStorage = await migration75.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 75,
      },
      data: {
        FooController: { a: 'b' },
      },
    });
  });
});
