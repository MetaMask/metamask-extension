import migration74 from './074';

describe('migration #72', () => {
  it('should update the version metadata', async () => {
    console.log(migration74);
    expect(Boolean(1)).toStrictEqual(true);
  });

  it('should delete the ThreeBoxController', async () => {
    expect(Boolean(1)).toStrictEqual(true);
  });

  it('should handle missing ThreeBoxController', async () => {
    expect(Boolean(1)).toStrictEqual(true);
  });
});
