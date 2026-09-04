import { cloneDeep } from 'lodash';
import { migrate, version } from './224';

describe(`migration #${version}`, () => {
  it('removes canTrackWalletFundsObtained from AppStateController', async () => {
    const versionedData = {
      meta: { version: version - 1 },
      data: {
        AppStateController: {
          canTrackWalletFundsObtained: true,
          connectedStatusPopoverHasBeenShown: true,
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(cloneDeep(versionedData), changedControllers);

    expect(changedControllers).toStrictEqual(new Set(['AppStateController']));
  });
});
