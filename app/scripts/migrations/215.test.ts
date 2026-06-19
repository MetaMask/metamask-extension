import { cloneDeep } from 'lodash';
import { migrate, version } from './215';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes importTokensModalOpen from persisted UI app state', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        appState: {
          alertOpen: false,
          importTokensModalOpen: true,
        },
        metamask: {
          isInitialized: true,
          importTokensModalOpen: false,
        },
        customNonceValue: '',
        importTokensModalOpen: true,
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData).toStrictEqual({
      meta: { version: VERSION },
      data: {
        appState: {
          alertOpen: false,
        },
        metamask: {
          isInitialized: true,
        },
        customNonceValue: '',
      },
    });
    expect(changedControllers).toStrictEqual(new Set(['appState', 'metamask']));
  });

  it('does not mark state changed when importTokensModalOpen is absent', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        appState: {
          alertOpen: false,
        },
        metamask: {
          isInitialized: true,
        },
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData).toStrictEqual({
      meta: { version: VERSION },
      data: oldStorage.data,
    });
    expect(changedControllers).toStrictEqual(new Set([]));
  });
});
