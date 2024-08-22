import { migrate, version, PPOMController } from './126';

const oldStorage = {
  meta: { version },
  data: {
    PPOMController: {
      versionInfo: [
        {
          filePath: '/test',
          hashSignature: 'DUMMY_HASH_SIGNATURE',
        },
      ],
      versionFileETag: 'DUMMY_VERSION_FILE_ETAG',
    },
  },
};

describe('migration #126', () => {
  it('should remove versionFileETag from PPOMController', async () => {
    const newStorage = await migrate(oldStorage);

    const { versionFileETag } = newStorage.data.PPOMController as PPOMController;

    expect(versionFileETag).toBeUndefined();
  });

  it('should not effect other fields in PPOMController', async () => {
    const newStorage = await migrate(oldStorage);

    const { versionInfo } = newStorage.data.PPOMController as PPOMController;

    expect(versionInfo).toBeDefined();
  });
});
