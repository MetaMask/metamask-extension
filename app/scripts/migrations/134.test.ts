import { cloneDeep } from 'lodash';
import { migrate, version } from './134';

const oldVersion = 133;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('Does nothing if `usedNetworks` is not in the `AppStateController` state', async () => {
    const oldState = {
      AppStateController: {
        timeoutMinutes: 0,
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(oldState);
  });

  it('Removes `usedNetworks` from the `AppStateController` state', async () => {
    const oldState: {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AppStateController: {
        timeoutMinutes: number;
        usedNetworks?: Record<string, boolean>;
      };
    } = {
      AppStateController: {
        timeoutMinutes: 0,
        usedNetworks: {
          '0x1': true,
          '0x5': true,
          '0x539': true,
        },
      },
    };
    const expectedState = {
      AppStateController: {
        timeoutMinutes: 0,
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(expectedState);
  });
});
