import { SubjectType } from '@metamask/permission-controller';
import migration69 from './069';

describe('migration #69', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 68,
      },
      data: {},
    };

    const newStorage = await migration69.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 69,
    });
  });

  it('should migrate all data', async () => {
    const oldStorage = {
      meta: {
        version: 68,
      },
      data: {
        FooController: { a: 'b' },
        SubjectMetadataController: {
          subjectMetadata: {
            'https://1inch.exchange': {
              iconUrl:
                'https://1inch.exchange/assets/favicon/favicon-32x32.png',
              name: 'DEX Aggregator - 1inch.exchange',
              origin: 'https://1inch.exchange',
              extensionId: null,
            },
            'https://ascii-tree-generator.com': {
              iconUrl: 'https://ascii-tree-generator.com/favicon.ico',
              name: 'ASCII Tree Generator',
              origin: 'https://ascii-tree-generator.com',
              extensionId: 'ascii-tree-generator-extension',
            },
            'https://null.com': null,
            'https://foo.com': 'bad data',
            'https://bar.com': ['bad data'],
          },
        },
      },
    };

    const newStorage = await migration69.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 69,
      },
      data: {
        FooController: { a: 'b' },
        SubjectMetadataController: {
          subjectMetadata: {
            'https://1inch.exchange': {
              iconUrl:
                'https://1inch.exchange/assets/favicon/favicon-32x32.png',
              name: 'DEX Aggregator - 1inch.exchange',
              origin: 'https://1inch.exchange',
              extensionId: null,
              subjectType: SubjectType.Website,
            },
            'https://ascii-tree-generator.com': {
              iconUrl: 'https://ascii-tree-generator.com/favicon.ico',
              name: 'ASCII Tree Generator',
              origin: 'https://ascii-tree-generator.com',
              extensionId: 'ascii-tree-generator-extension',
              subjectType: SubjectType.Extension,
            },
            'https://null.com': null,
            'https://foo.com': 'bad data',
            'https://bar.com': ['bad data'],
          },
        },
      },
    });
  });

  it('should handle missing SubjectMetadataController', async () => {
    const oldStorage = {
      meta: {
        version: 68,
      },
      data: {
        FooController: { a: 'b' },
      },
    };

    const newStorage = await migration69.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 69,
      },
      data: {
        FooController: { a: 'b' },
      },
    });
  });
});
